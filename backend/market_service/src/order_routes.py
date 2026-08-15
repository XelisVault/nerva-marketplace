import os
import uuid
import imghdr
import logging
import requests
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter
from fastapi import FastAPI, Request, Depends, HTTPException, Response, Cookie, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .dependencies import get_db, get_sessions
from .config import settings

orders_router = APIRouter()

@orders_router.get("/vendor/orders")
async def get_vendor_orders(session_id:str=Cookie(None), session_storage=Depends(get_sessions), sql_client=Depends(get_db),):
    if not session_id:
        raise HTTPException(status_code=401)
    username = session_storage.getUserFromSession(session_id)
    if not username:
        raise HTTPException(status_code=422)
    # todo: assert that the requestor is a vendor
    async with sql_client.cursor() as cur:
        await cur.execute("SELECT * FROM orders WHERE vendor=%s", (username))
        vendor_orders = await cur.fetchall()
    result = []
    for order in vendor_orders:
        order_invoice_details = requests.get(f"{settings.PAYMENTS_BASE_URL}/invoice/{order['invoice_id']}")
        print(order_invoice_details.json())
        order['status'] = order_invoice_details.json()['status']
        order['create_time'] = order['create_time'].strftime("%Y-%m-%d %H:%M:%S")
        print(order)
        result.append({ "order_id": order['order_id'], "create_time": order['create_time'], "amount": order_invoice_details.json()['amount'], "status": order_invoice_details.json()['status'] })
    return result

@orders_router.get("/customer/orders")
async def get_customer_orders(session_id:str=Cookie(None), session_storage=Depends(get_sessions), sql_client=Depends(get_db),):
    if not session_id:
        raise HTTPException(status_code=401)
    username = session_storage.getUserFromSession(session_id)
    if not username:
        raise HTTPException(status_code=422)
    # todo: assert that the requestor is not a vendor ? - visit whether vendors should be able to buy at all
    async with sql_client.cursor() as cur:
            await cur.execute("SELECT * FROM orders WHERE buyer=%s", (username))
            buyer_orders = await cur.fetchall()
            result = []
            for order in buyer_orders:
                order_invoice_details = requests.get(f"{settings.PAYMENTS_BASE_URL}/invoice/{order['invoice_id']}")
                order['invoice_status'] = order_invoice_details.json()['status']
                order['create_time'] = order['create_time'].strftime("%Y-%m-%d %H:%M:%S")
                order['shipping_status'] = "Awaiting Vendor"
                print(order)
                result.append({ "order_id": order['order_id'], "create_time": order['create_time'], "status": order['status'] })
    return result