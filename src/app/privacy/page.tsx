import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().getFullYear()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold">1. Information we collect</h2>
            <p className="text-muted-foreground">
              When you register an account, we collect your username, email address,
              and a password (stored as an Argon2id hash). When you place an order,
              we store the shipping details you provide so the vendor can fulfil
              the order.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">2. How we use your information</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Your email is used to send account-activation links and to contact
                you about order problems.
              </li>
              <li>
                Your shipping address is shared with the vendor of the listing(s)
                you purchased.
              </li>
              <li>
                Your username is visible on listings you create and on orders you
                place (to the vendor only).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold">3. Server logs</h2>
            <p className="text-muted-foreground">
              We log IP addresses to defend against DDoS attacks and abuse. Logs
              are retained for 30 days and are never shared with third parties
              except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">4. Payments</h2>
            <p className="text-muted-foreground">
              All payments are made in NERVA (XNV) and sent directly to the
              vendor's payment address. The marketplace never holds user funds.
              Payment confirmations are observed by the wallet RPC server and
              pushed to your browser over WebSocket.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">5. Cookies</h2>
            <p className="text-muted-foreground">
              We use a single essential cookie (<code>session_id</code>) to keep
              you signed in. It is set with <code>HttpOnly</code>,{" "}
              <code>Secure</code> (in production), and <code>SameSite=Lax</code>{" "}
              attributes. We do not use analytics or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">6. Contact</h2>
            <p className="text-muted-foreground">
              For privacy questions, open an issue on{" "}
              <a
                href="https://github.com/XelisVault/nerva-marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
