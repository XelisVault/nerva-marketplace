"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
} from "@/components/icons";

type State = "loading" | "success" | "error" | "already-active";

export default function ActivatePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi
      .activate(token)
      .then(() => setState("success"))
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : "Activation failed.";
        setMessage(msg);
        setState("error");
      });
  }, [token]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="text-primary h-10 w-10 animate-spin" />
              <div>
                <h1 className="text-foreground text-lg font-semibold">
                  Activating your account…
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Please wait a moment.
                </p>
              </div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="bg-success/15 flex h-14 w-14 items-center justify-center rounded-full">
                <CheckCircle2 className="text-success h-8 w-8" />
              </div>
              <div>
                <h1 className="text-foreground text-lg font-semibold">
                  Account activated!
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  You can now sign in to your NERVA Marketplace account.
                </p>
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="bg-destructive/15 flex h-14 w-14 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive h-8 w-8" />
              </div>
              <div>
                <h1 className="text-foreground text-lg font-semibold">
                  Activation failed
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {message ||
                    "This activation link is invalid or has expired."}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/register">Try registering again</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
