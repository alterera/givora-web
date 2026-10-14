"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  images?: Array<{ url: string }>;
  variants: Array<{ id: string; sku: string; onHand: number; reserved: number; pricePaise: number }>;
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
      toast.success(`Created "${payload.name}" (${formatInr(payload.pricePaise)})`);
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

  async function seedOneRupeeProduct() {
    const suffix = Date.now().toString().slice(-4);
    await createProduct({
      name: "Classic Creator Postcard (₹1)",
      slug: `classic-creator-postcard-${suffix}`,
      description: "A signature ₹1 Givora thank-you token to test instant creator gifting.",
      sku: `GIFT-1RS-${suffix}`,
      pricePaise: 100,
    });
  }

  async function upload(productId: string, file: File) {
    try {
      const presign = await api<{ uploadUrl: string; publicUrl: string }>("/api/v1/admin/media/presign", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      await api(`/api/v1/admin/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify({ url: presign.publicUrl, alt: file.name }),
      });
      toast.success("Product image uploaded");
      await refresh();
    } catch {
      toast.error("Image upload failed");
    }
  }

  const hasOneRupee = products.some((p) => p.variants.some((v) => v.pricePaise === 100));

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-5">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Catalogue</p>
              <h1 className="font-serif mt-1 text-2xl">Add New Product</h1>
            </div>
            {!hasOneRupee && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void seedOneRupeeProduct()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-2 text-xs font-semibold text-gold transition hover:bg-gold/25"
              >
                <Sparkles className="h-3.5 w-3.5" />
                + Add ₹1 Test Gift
              </button>
            )}
          </div>

          <form className="mt-5 space-y-3" onSubmit={create}>
            <Field
              label="Product name"
              placeholder="e.g. Handwritten Thank-You Postcard"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slug) setSlug(slugify(event.target.value));
              }}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Price in ₹ (Rupees)"
                type="number"
                min={1}
                step="1"
                value={priceRupees}
                onChange={(event) => setPriceRupees(event.target.value)}
                required
              />
              <Field
                label="SKU"
                placeholder="GIFT-001"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                required
              />
            </div>
            <Field
              label="URL slug"
              placeholder="thank-you-postcard"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
            />
            <TextArea
              label="Description"
              placeholder="Describe what the creator receives…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={busy}>
              <Plus className="mr-1.5 inline h-4 w-4" />
              {busy ? "Adding…" : `Add product (${formatInr(Math.round((Number(priceRupees) || 0) * 100))})`}
            </Button>
          </form>
        </div>
      </section>

      <section className="space-y-4 lg:col-span-7">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Inventory</p>
              <h2 className="font-serif mt-1 text-2xl">Catalogue Products ({products.length})</h2>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void seedOneRupeeProduct()}
              className="glass-subtle inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-ink hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Quick-create ₹1 Gift
            </button>
          </div>

          {productsQuery.error instanceof ApiError && (
            <p className="mt-4 rounded-2xl bg-rose/10 p-3 text-sm text-rose">{productsQuery.error.message}</p>
          )}

          <div className="mt-5 space-y-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="glass-subtle flex flex-col justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl">{product.name}</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 [html[data-theme=light]_&]:text-emerald-800">
                      {product.status}
                    </span>
                  </div>
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex flex-wrap items-center gap-3 text-xs text-ink/80">
                      <span className="font-semibold text-gold">{formatInr(variant.pricePaise)}</span>
                      <span className="font-mono">{variant.sku}</span>
                      <span>
                        Stock: <strong>{variant.onHand}</strong> on hand · {variant.reserved} reserved
                      </span>
                      <button
                        type="button"
                        className="glass-subtle rounded-full px-2.5 py-0.5 font-medium hover:opacity-90"
                        onClick={() =>
                          void api(`/api/v1/admin/variants/${variant.id}/stock`, {
                            method: "PATCH",
                            body: JSON.stringify({ delta: 10, reason: "Manual restock" }),
                          }).then(refresh)
                        }
                      >
                        +10 stock
                      </button>
                    </div>
                  ))}
                </div>

                <label className="glass-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-ink hover:opacity-90">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload photo
                  <input
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(product.id, file);
                    }}
                  />
                </label>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
