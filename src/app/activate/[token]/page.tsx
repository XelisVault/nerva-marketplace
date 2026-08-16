"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type State = "loading" | "success" | "error";

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
        setMessage(err instanceof Error ? err.message : "Activation failed.");
        setState("error");
      });
  }, [token]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Activating...</h1>
                <p className="mt-1 text-sm text-muted-foreground">Please wait.</p>
              </div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Account activated</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can now sign in.
                </p>
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Activation failed</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {message || "This activation link is invalid or expired."}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/register">Try again</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
