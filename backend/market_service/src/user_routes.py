"""
Market service — user routes (register, activate, login, logout, whoami).

Security highlights vs. the original:
- Argon2id password hashing (unchanged — already good).
- Proper 1-tuple parameterisation (`(arg,)`).
- Rate limiting on login and register.
- Email + username + password validation with proper HTTP 422 errors.
- `whoami` returns 401 (not `null`) when unauthenticated, so the frontend
  can distinguish "session expired" from "loading".
- Logout actually destroys the session in Redis (the original had a TODO).
"""

import re
import uuid
import logging
from typing import Optional

import nacl.pwhash.argon2id
from pydantic import BaseModel, EmailStr, field_validator
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request

from .config import settings
from .dependencies import (
    get_db,
    get_sessions,
    Sessions,
    check_rate_limit,
)

logger = logging.getLogger(__name__)
router = APIRouter()

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,32}$")
PASSWORD_MIN_LEN = 8
PASSWORD_MAX_LEN = 128


def hash_password(password: str) -> str:
    return nacl.pwhash.argon2id.str(password.encode("utf-8")).decode("utf-8")


def verify_password(hashed: str, password: str) -> bool:
    try:
        nacl.pwhash.argon2id.verify(
            hashed.encode("utf-8"), password.encode("utf-8")
        )
        return True
    except nacl.exceptions.InvalidkeyError:
        return False


def client_ip(request: Request) -> str:
    """Best-effort client-IP extraction (respects X-Forwarded-For)."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ============================================================
# Registration
# ============================================================

class UserRegistrationSubmitRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not USERNAME_RE.match(v):
            raise ValueError(
                "Username must be 3–32 chars (letters, digits, underscore)."
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < PASSWORD_MIN_LEN:
            raise ValueError(f"Password must be at least {PASSWORD_MIN_LEN} characters.")
        if len(v) > PASSWORD_MAX_LEN:
            raise ValueError(f"Password must be at most {PASSWORD_MAX_LEN} characters.")
        return v


@router.post("/users/registration/submit")
async def user_registration_submit(
    req: UserRegistrationSubmitRequest,
    request: Request,
    rds_client=Depends(get_db),
    session_storage: Sessions = Depends(get_sessions),
):
    # Rate limit
    ip = client_ip(request)
    if not check_rate_limit(
        session_storage, "register", ip, settings.RATE_LIMIT_REGISTER_PER_MIN
    ):
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts. Please try again later.",
        )

    # Check username + email uniqueness up-front.
    async with rds_client.cursor() as cur:
        await cur.execute(
            "SELECT username FROM users WHERE username = %s OR email = %s",
            (req.username, req.email),
        )
        if await cur.fetchone():
            raise HTTPException(status_code=409, detail="Username or email already taken.")

    activation_token = str(uuid.uuid4())
    async with rds_client.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO users (username, email, password)
            VALUES (%s, %s, %s)
            """,
            (req.username, req.email, hash_password(req.password)),
        )
        await cur.execute(
            """
            INSERT INTO user_validation_tokens (token, username)
            VALUES (%s, %s)
            """,
            (activation_token, req.username),
        )

    # TODO: send activation email containing a link to
    #   https://<frontend-host>/activate/<activation_token>
    # For now, log it so an operator can copy/paste during dev.
    logger.info("Activation token for %s: %s", req.username, activation_token)

    return {"status": "registered", "next": "check_email"}


@router.post("/users/registration/activate/{activation_token}")
async def user_registration_activate(activation_token: str, rds_client=Depends(get_db)):
    if not activation_token or len(activation_token) > 64:
        raise HTTPException(status_code=400, detail="Invalid activation token.")

    async with rds_client.cursor() as cur:
        # Find the token + user.
        await cur.execute(
            """
            SELECT username FROM user_validation_tokens WHERE token = %s
            """,
            (activation_token,),
        )
        row = await cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Activation token not found.")

        # Mark the user as active.
        await cur.execute(
            """
            UPDATE users SET status = 'active' WHERE username = %s
            """,
            (row["username"],),
        )
        # Burn the token so it can't be reused.
        await cur.execute(
            "DELETE FROM user_validation_tokens WHERE token = %s",
            (activation_token,),
        )

    return {"status": "active"}


# ============================================================
# Login / Logout
# ============================================================

class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/users/login")
async def user_login(
    request: Request,
    body: LoginRequest,
    response: Response,
    rds_client=Depends(get_db),
    session_storage: Sessions = Depends(get_sessions),
):
    ip = client_ip(request)
    if not check_rate_limit(
        session_storage, "login", ip, settings.RATE_LIMIT_LOGIN_PER_MIN
    ):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later.",
        )

    async with rds_client.cursor() as cur:
        await cur.execute(
            "SELECT * FROM users WHERE username = %s",
            (body.username,),
        )
        user_row = await cur.fetchone()

    if not user_row or not verify_password(user_row["password"], body.password):
        # Constant-ish-time failure — don't leak whether the username exists.
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if user_row["status"] != "active":
        raise HTTPException(
            status_code=403,
            detail="Account is not active. Please activate via email.",
        )

    session_id = session_storage.make_new_user_session(
        body.username, is_vendor=bool(user_row["is_vendor"])
    )
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=settings.SESSION_SECURE,
        samesite=settings.SESSION_SAMESITE,
        max_age=settings.SESSION_TTL_SECONDS,
        path="/",
    )
    return {"status": "ok"}


@router.post("/users/logout")
async def users_logout(
    response: Response,
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
):
    """Always returns 200, even if there was no session — idempotent."""
    if session_id:
        session_storage.destroy_session(session_id)
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {"status": "ok"}


@router.get("/users/whoami")
async def users_whoami(
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    rds_client=Depends(get_db),
    session_storage: Sessions = Depends(get_sessions),
):
    """Return the current user, or 401 if unauthenticated."""
    username = session_storage.get_user_from_session(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    async with rds_client.cursor() as cur:
        await cur.execute(
            """
            SELECT username, email, status, is_vendor
            FROM users WHERE username = %s
            """,
            (username,),
        )
        user = await cur.fetchone()
    if not user:
        # Session exists but user was deleted.
        session_storage.destroy_session(session_id)
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user
