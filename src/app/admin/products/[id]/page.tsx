"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { uploadProductImage } from "@/lib/admin-product-media";
import { formatInr } from "@/lib/money";
import type { AdminProduct } from "@/app/admin/products/page";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [priceRupees, setPriceRupees] = useState("");
  const [sku, setSku] = useState("");
  const [stockDelta, setStockDelta] = useState("10");
  const [busy, setBusy] = useState(false);

  function load() {
    return api<AdminProduct>(`/api/v1/admin/products/${params.id}`).then((row) => {
      setProduct(row);
      setName(row.name);
      setDescription(row.description);
      setStatus(row.status);
      const v = row.variants[0];
      if (v) {
        setPriceRupees(String(v.pricePaise / 100));
        setSku(v.sku);
      }
    });
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof ApiError ? error.message : "Not found"));
  }, [params.id]);

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (!product) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), description: description.trim(), status }),
      });
      const variant = product.variants[0];
      if (variant) {
        const paise = Math.round(Number(priceRupees) * 100);
        await api(`/api/v1/admin/variants/${variant.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sku: sku.trim(), pricePaise: paise }),
        });
      }
      toast.success("Product saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function adjustStock() {
    const variant = product?.variants[0];
    if (!variant) return;
    const delta = Number(stockDelta);
    if (!Number.isFinite(delta) || delta === 0) return;
    try {
      await api(`/api/v1/admin/variants/${variant.id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ delta, reason: "Admin manual adjustment" }),
      });
      toast.success("Stock updated");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Stock update failed");
    }
  }

  async function onUpload(file: File) {
    if (!product) return;
    try {
      await uploadProductImage(product.id, file);
      toast.success("Image uploaded");
      await load();
    } catch {
      toast.error("Upload failed");
    }
  }

  async function removeImage(imageId: string) {
    if (!product) return;
    try {
      await api(`/api/v1/admin/products/${product.id}/images/${imageId}`, { method: "DELETE" });
      toast.success("Image removed");
      await load();
    } catch {
      toast.error("Could not remove image");
    }
  }

  if (!product) {
    return <p className="text-muted-foreground">Loading product…</p>;
  }

  const variant = product.variants[0];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>

      <AdminPageHeader title={product.name} description={`/${product.slug} · ${product.type}`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Details & pricing</h2>
          <form className="mt-4 space-y-3" onSubmit={saveDetails}>
            <Field label="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Status</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
            {variant && (
              <>
                <Field label="Price (₹)" type="number" min={1} step="0.01" value={priceRupees} onChange={(e) => setPriceRupees(e.target.value)} />
                <Field label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Listed as {formatInr(variant.pricePaise)} · {variant.onHand} on hand · {variant.reserved} reserved
                </p>
              </>
            )}
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </form>
        </AdminCard>

        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Images</h2>
          <p className="mt-1 text-sm text-muted-foreground">First image is used on the wishlist 3D carousel.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-paper opacity-0 transition group-hover:opacity-100"
                  onClick={() => void removeImage(img.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/30">
            <ImagePlus className="h-4 w-4" />
            Add image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
              }}
            />
          </label>
        </AdminCard>
      </div>

      {variant && (
        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Inventory</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Adjust stock by" type="number" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} />
            <Button type="button" variant="ghost" className="rounded-lg" onClick={() => void adjustStock()}>
              Apply adjustment
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
