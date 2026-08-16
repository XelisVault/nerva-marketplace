"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { listingApi, HttpError } from "@/lib/api-client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { BackButton } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ImageIcon, Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function CreateListingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    payment_address?: string;
    file?: string;
  }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (title.trim().length < 3 || title.trim().length > 120)
      errs.title = "Title must be 3-120 characters.";
    if (description.trim().length < 10 || description.trim().length > 2048)
      errs.description = "Description must be 10-2048 characters.";
    const p = parseFloat(price);
    if (Number.isNaN(p) || p <= 0) errs.price = "Enter a positive price.";
    else if (p > 1_000_000) errs.price = "Price must be < 1,000,000 XNV.";
    // Validate NERVA payment address.
    if (!paymentAddress.trim()) {
      errs.payment_address = "Payment address is required.";
    } else if (paymentAddress.trim().length < 60 || paymentAddress.trim().length > 200) {
      errs.payment_address = "Address must be 60-200 characters.";
    } else if (!/^(NV|NS|Niz)/.test(paymentAddress.trim())) {
      errs.payment_address = "Address must start with NV, NS, or Niz.";
    }
    if (!file) errs.file = "Image is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!VALID_FILE_TYPES.includes(f.type)) {
      setFieldErrors((p) => ({ ...p, file: "PNG, JPEG or WebP only." }));
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFieldErrors((p) => ({
        ...p,
        file: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB).`,
      }));
      return;
    }
    setFile(f);
    setFieldErrors((p) => ({ ...p, file: undefined }));
    setFilePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await listingApi.create({
        title: title.trim(),
        description: description.trim(),
        price_xnv: parseFloat(price),
        payment_address: paymentAddress.trim(),
        file,
      });
      toast.success("Listing created");
      router.push("/listings");
    } catch (err) {
      const msg =
        err instanceof HttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create listing.";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <BackButton fallback="/listings" />
      <h1 className="mb-4 text-xl font-semibold">Create Listing</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4" />
            Listing Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NVIDIA GT 730 GPU"
                maxLength={120}
                className={cn(fieldErrors.title && "border-destructive")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fieldErrors.title ?? "Max 120 characters."}</span>
                <span>{title.length}/120</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item, its condition, what's included, shipping terms..."
                rows={5}
                maxLength={2048}
                className={cn("resize-none", fieldErrors.description && "border-destructive")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fieldErrors.description ?? "Max 2048 characters."}</span>
                <span>{description.length}/2048</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (XNV)</Label>
              <Input
                id="price"
                type="number"
                step="0.0001"
                min="0.0001"
                max="1000000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1.0"
                className={cn(fieldErrors.price && "border-destructive")}
              />
              {fieldErrors.price && (
                <p className="text-xs text-destructive">{fieldErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_address">
                Your NERVA Payment Address
              </Label>
              <Input
                id="payment_address"
                type="text"
                value={paymentAddress}
                onChange={(e) => setPaymentAddress(e.target.value)}
                placeholder="NV..."
                className={cn(
                  "font-mono text-xs",
                  fieldErrors.payment_address && "border-destructive",
                )}
              />
              <p className="text-xs text-muted-foreground">
                Payments for this listing go directly to this address.
                Generate one from your NERVA wallet (nerva-wallet-cli or GUI).
                Normal addresses start with NV, subaddresses with NS.
              </p>
              {fieldErrors.payment_address && (
                <p className="text-xs text-destructive">{fieldErrors.payment_address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Image</Label>
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50",
                  fieldErrors.file && "border-destructive",
                )}
              >
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-48 rounded-md object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPEG or WebP. Max 10 MB.
                      </p>
                    </div>
                  </>
                )}
                <Input
                  id="file"
                  type="file"
                  accept={VALID_FILE_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
              {fieldErrors.file && (
                <p className="text-xs text-destructive">{fieldErrors.file}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Listing"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <ProtectedRoute vendorOnly>
      <CreateListingForm />
    </ProtectedRoute>
  );
}
