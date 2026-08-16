import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().getFullYear()}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <section>
            <h2 className="text-foreground text-base font-semibold">
              1. Information we collect
            </h2>
            <p className="text-muted-foreground">
              When you register an account on NERVA Marketplace, we collect
              your username, email address, and a password (stored as an
              Argon2id hash — we never see your plaintext password). When you
              place an order, we store the shipping details you provide so
              the vendor can fulfil the order.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              2. How we use your information
            </h2>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              <li>
                Your email is used solely to send you account-activation
                links and to contact you about problems with your orders.
              </li>
              <li>
                Your shipping address is shared with the vendor of the
                listing(s) you purchased, so they can ship your order.
              </li>
              <li>
                Your username is publicly visible on listings you create
                and on orders you place (to the relevant vendor only).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              3. Server logs
            </h2>
            <p className="text-muted-foreground">
              We log IP addresses for the purpose of defending against
              distributed denial-of-service (DDoS) attacks and other abuse.
              Logs are retained for a maximum of 30 days and are never
              shared with third parties except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              4. Payments
            </h2>
            <p className="text-muted-foreground">
              All payments on NERVA Marketplace are made in NERVA (XNV) and
              sent directly to a unique subaddress controlled by the vendor
              (or by the marketplace operator for the test listing). The
              marketplace never custodies user funds. Payment confirmations
              are observed by the wallet RPC server and broadcast to your
              browser over a WebSocket so you can track status in real time.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              5. Cookies
            </h2>
            <p className="text-muted-foreground">
              We use a single essential cookie (<code>session_id</code>) to
              keep you signed in. This cookie is set with{" "}
              <code>HttpOnly</code>, <code>Secure</code> (in production), and{" "}
              <code>SameSite=Lax</code> attributes. We do not use any
              analytics or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              6. Your rights
            </h2>
            <p className="text-muted-foreground">
              You can request deletion of your account and associated data
              at any time by contacting the marketplace operator. Note that
              completed orders must be retained for accounting purposes
              where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-base font-semibold">
              7. Contact
            </h2>
            <p className="text-muted-foreground">
              For privacy questions, open an issue on{" "}
              <a
                href="https://github.com/XelisVault/nerva-marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                the GitHub repository
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
