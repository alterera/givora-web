"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { uploadProductImage } from "@/lib/admin-product-media";
import { formatInr } from "@/lib/money";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  type: string;
  images: Array<{ id: string; url: string; alt: string | null }>;
  variants: Array<{ id: string; sku: string; name: string; onHand: number; reserved: number; pricePaise: number }>;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api<AdminProduct[]>("/api/v1/admin/products"),
  });
  const products = productsQuery.data ?? [];
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [priceRupees, setPriceRupees] = useState("1");
  const [busy, setBusy] = useState(false);

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function createProduct(payload: {
    name: string;
    slug: string;
    description: string;
    sku: string;
    pricePaise: number;
  }) {
    setBusy(true);
    try {
      const product = await api<{ id: string }>("/api/v1/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          status: "ACTIVE",
        }),
      });
      await api(`/api/v1/admin/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify({
          sku: payload.sku,
          name: "Standard",
          pricePaise: payload.pricePaise,
          onHand: 50,
        }),
      });
      toast.success(`Created "${payload.name}"`);
      setShowCreate(false);
      setName("");
      setSlug("");
      setDescription("");
      setSku("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create product");
    } finally {
      setBusy(false);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const rupees = Number(priceRupees);
    if (!Number.isFinite(rupees) || rupees < 1) {
      toast.error("Price must be at least ₹1");
      return;
    }
    await createProduct({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      pricePaise: Math.round(rupees * 100),
    });
  }

  async function quickUpload(productId: string, file: File) {
    try {
      await uploadProductImage(productId, file);
      toast.success("Image added");
      await refresh();
    } catch {
      toast.error("Upload failed");
    }
  }

  const hasOneRupee = products.some((p) => p.variants.some((v) => v.pricePaise === 100));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <AdminPageHeader
        title="Catalogue"
        description="Manage gift products, images, pricing, and inventory."
      >
        <Button type="button" variant="ghost" className="rounded-lg" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4" />
          New product
        </Button>
        {!hasOneRupee && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg text-gold"
            disabled={busy}
            onClick={() =>
              void createProduct({
                name: "Classic Creator Postcard (₹1)",
                slug: `classic-creator-postcard-${Date.now().toString().slice(-4)}`,
                description: "A signature ₹1 Givora thank-you token to test instant creator gifting.",
                sku: `GIFT-1RS-${Date.now().toString().slice(-4)}`,
                pricePaise: 100,
              })
            }
          >
            <Sparkles className="h-4 w-4" />
            ₹1 test gift
          </Button>
        )}
      </AdminPageHeader>

      {showCreate && (
        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Create product</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={create}>
            <Field label="Name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} required />
            <Field label="Slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
            <Field label="Price (₹)" type="number" min={1} value={priceRupees} onChange={(e) => setPriceRupees(e.target.value)} required />
            <Field label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
            <div className="sm:col-span-2">
              <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>Create product</Button>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Images</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const variant = product.variants[0];
                const thumb = product.images[0]?.url;
                return (
                  <tr key={product.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{product.status}</span>
                    </td>
                    <td className="px-4 py-3">{variant ? formatInr(variant.pricePaise) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {variant ? `${variant.onHand} on hand · ${variant.reserved} reserved` : "—"}
                    </td>
                    <td className="px-4 py-3">{product.images.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted/40">
                          <ImagePlus className="h-3.5 w-3.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void quickUpload(product.id, file);
                            }}
                          />
                        </label>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {productsQuery.error instanceof ApiError && (
          <p className="border-t border-border p-4 text-sm text-rose">{productsQuery.error.message}</p>
        )}
      </AdminCard>
    </div>
  );
}
