"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { uploadProductImage } from "@/lib/admin-product-media";
import { formatInr } from "@/lib/money";
import type { AdminProduct } from "@/app/admin/products/page";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

type Taxonomy = { id: string; name: string; slug: string };

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [type, setType] = useState("PHYSICAL");
  const [shippingRupees, setShippingRupees] = useState("0");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [refundTerms, setRefundTerms] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [occasionId, setOccasionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [newVariantName, setNewVariantName] = useState("Standard");
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("1");

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api<Array<Taxonomy & { isActive: boolean }>>("/api/v1/admin/categories"),
  });
  const occasionsQuery = useQuery({
    queryKey: ["admin-occasions"],
    queryFn: () => api<Array<Taxonomy & { isActive: boolean }>>("/api/v1/admin/occasions"),
  });

  function applyRow(row: AdminProduct) {
    setProduct(row);
    setName(row.name);
    setSlug(row.slug);
    setDescription(row.description);
    setStory(row.story ?? "");
    setStatus(row.status);
    setType(row.type);
    setShippingRupees(String(row.shippingPaise / 100));
    setDeliveryInfo(row.deliveryInfo ?? "");
    setRefundTerms(row.refundTerms ?? "");
    setCategoryId(row.categoryId ?? "");
    setOccasionId(row.occasionId ?? "");
  }

  function load() {
    return api<AdminProduct>(`/api/v1/admin/products/${params.id}`).then(applyRow);
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
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          story: story.trim() || undefined,
          status,
          type,
          shippingPaise: Math.round(Number(shippingRupees) * 100) || 0,
          deliveryInfo: deliveryInfo.trim() || undefined,
          refundTerms: refundTerms.trim() || undefined,
          categoryId: categoryId || null,
          occasionId: occasionId || null,
        }),
      });
      toast.success("Product saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveVariant(variantId: string, patch: { sku?: string; name?: string; pricePaise?: number; isActive?: boolean }) {
    try {
      await api(`/api/v1/admin/variants/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success("Variant updated");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Variant update failed");
    }
  }

  async function addVariant(event: React.FormEvent) {
    event.preventDefault();
    if (!product) return;
    const paise = Math.round(Number(newVariantPrice) * 100);
    if (!Number.isFinite(paise) || paise < 1) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await api(`/api/v1/admin/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify({
          name: newVariantName.trim(),
          sku: newVariantSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          pricePaise: paise,
          onHand: type === "DIGITAL" ? 0 : 10,
        }),
      });
      toast.success("Variant added");
      setNewVariantSku("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not add variant");
    }
  }

  async function removeVariant(variantId: string) {
    if (!window.confirm("Remove or deactivate this variant?")) return;
    try {
      const result = await api<{ deactivated?: boolean; deleted?: boolean }>(`/api/v1/admin/variants/${variantId}`, {
        method: "DELETE",
      });
      toast.success(result.deactivated ? "Variant deactivated" : "Variant removed");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not remove variant");
    }
  }

  async function adjustStock(variantId: string, delta: number) {
    if (!delta) return;
    try {
      await api(`/api/v1/admin/variants/${variantId}/stock`, {
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

  async function moveImage(imageId: string, direction: -1 | 1) {
    if (!product) return;
    const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((img) => img.id === imageId);
    const swap = sorted[index + direction];
    if (!sorted[index] || !swap) return;
    try {
      await Promise.all([
        api(`/api/v1/admin/products/${product.id}/images/${sorted[index].id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: swap.sortOrder }),
        }),
        api(`/api/v1/admin/products/${product.id}/images/${swap.id}`, {
          method: "PATCH",
          body: JSON.stringify({ sortOrder: sorted[index].sortOrder }),
        }),
      ]);
      await load();
    } catch {
      toast.error("Could not reorder images");
    }
  }

  async function removeProduct() {
    if (!product) return;
    if (!window.confirm(`Remove "${product.name}"?`)) return;
    try {
      const result = await api<{ archived?: boolean }>(`/api/v1/admin/products/${product.id}`, { method: "DELETE" });
      toast.success(result.archived ? "Product archived" : "Product deleted");
      router.push("/admin/products");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Remove failed");
    }
  }

  if (!product) {
    return <p className="text-muted-foreground">Loading product…</p>;
  }

  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>

      <AdminPageHeader title={product.name} description={`/${product.slug}`}>
        <Button type="button" variant="ghost" className="text-rose" onClick={() => void removeProduct()}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AdminPageHeader>

      <AdminCard className="p-6">
        <h2 className="font-serif text-xl">Product details</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveDetails}>
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Status</span>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Type</span>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Category</span>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Occasion</span>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2" value={occasionId} onChange={(e) => setOccasionId(e.target.value)}>
              <option value="">None</option>
              {(occasionsQuery.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <Field label="Shipping (₹)" type="number" min={0} step="0.01" value={shippingRupees} onChange={(e) => setShippingRupees(e.target.value)} />
          <div className="sm:col-span-2">
            <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Story (optional)" value={story} onChange={(e) => setStory(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Delivery info" value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Refund terms" value={refundTerms} onChange={(e) => setRefundTerms(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save product"}</Button>
          </div>
        </form>
      </AdminCard>

      <AdminCard className="p-6">
        <h2 className="font-serif text-xl">Variants</h2>
        <ul className="mt-4 space-y-4">
          {product.variants.map((variant) => (
            <li key={variant.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{variant.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{variant.sku}</p>
                  <p className="mt-1 text-sm">
                    {formatInr(variant.pricePaise)} · {variant.onHand} on hand · {variant.reserved} reserved
                    {!variant.isActive && <span className="ml-2 text-rose">Inactive</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void adjustStock(variant.id, 10)}>+10 stock</Button>
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void adjustStock(variant.id, -1)}>-1 stock</Button>
                  {!variant.isActive && (
                    <Button type="button" variant="ghost" className="text-xs" onClick={() => void saveVariant(variant.id, { isActive: true })}>
                      Reactivate
                    </Button>
                  )}
                  <Button type="button" variant="ghost" className="text-xs text-rose" onClick={() => void removeVariant(variant.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3" onSubmit={addVariant}>
          <Field label="Variant name" value={newVariantName} onChange={(e) => setNewVariantName(e.target.value)} required />
          <Field label="SKU" value={newVariantSku} onChange={(e) => setNewVariantSku(e.target.value)} />
          <Field label="Price (₹)" type="number" min={0.01} step="0.01" value={newVariantPrice} onChange={(e) => setNewVariantPrice(e.target.value)} required />
          <div className="sm:col-span-3">
            <Button type="submit" className="text-sm">Add variant</Button>
          </div>
        </form>
      </AdminCard>

      <AdminCard className="p-6">
        <h2 className="font-serif text-xl">Images</h2>
        <p className="mt-1 text-sm text-muted-foreground">First image appears on the wishlist carousel.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sortedImages.map((img, index) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex justify-between gap-1 p-1 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-0.5">
                  <button type="button" className="rounded bg-black/60 p-1 text-paper" onClick={() => void moveImage(img.id, -1)} disabled={index === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded bg-black/60 p-1 text-paper" onClick={() => void moveImage(img.id, 1)} disabled={index === sortedImages.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button type="button" className="rounded bg-black/60 p-1 text-paper" onClick={() => void removeImage(img.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/30">
          <ImagePlus className="h-4 w-4" />
          Add image
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onUpload(file); }} />
        </label>
      </AdminCard>
    </div>
  );
}
