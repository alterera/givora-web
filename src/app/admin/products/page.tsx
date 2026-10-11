"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  variants: Array<{ id: string; sku: string; onHand: number; reserved: number; pricePaise: number }>;
};

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
  const [pricePaise, setPricePaise] = useState(149900);

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const product = await api<{ id: string }>("/api/v1/admin/products", {
      method: "POST",
      body: JSON.stringify({ name, slug, description, status: "ACTIVE" }),
    });
    await api(`/api/v1/admin/products/${product.id}/variants`, {
      method: "POST",
      body: JSON.stringify({ sku, name: "Standard", pricePaise, onHand: 10 }),
    });
    toast.success("Product created");
    await refresh();
  }

  async function upload(productId: string, file: File) {
    const presign = await api<{ uploadUrl: string; publicUrl: string }>("/api/v1/admin/media/presign", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    });
    await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    await api(`/api/v1/admin/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify({ url: presign.publicUrl, alt: file.name }),
    });
    toast.success("Image registered");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-4xl">Products</h1>
      {productsQuery.error instanceof ApiError && <p className="mt-4 text-rose">{productsQuery.error.message}</p>}
      <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={create}>
        <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Field label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        <div className="md:col-span-2">
          <TextArea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
        </div>
        <Field label="SKU" value={sku} onChange={(event) => setSku(event.target.value)} required />
        <Field label="Price (paise)" type="number" value={pricePaise} onChange={(event) => setPricePaise(Number(event.target.value))} />
        <Button type="submit">Add product</Button>
      </form>
      <div className="mt-8 space-y-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl bg-white p-4">
            <h2 className="text-xl">{product.name}</h2>
            <p className="text-sm text-ink/60">{product.status}</p>
            {product.variants.map((variant) => (
              <div key={variant.id} className="mt-2 flex items-center gap-3 text-sm">
                <span>
                  {variant.sku}: {variant.onHand} on hand, {variant.reserved} held
                </span>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    void api(`/api/v1/admin/variants/${variant.id}/stock`, {
                      method: "PATCH",
                      body: JSON.stringify({ delta: 1, reason: "Manual restock" }),
                    }).then(refresh)
                  }
                >
                  +1
                </button>
              </div>
            ))}
            <input
              className="mt-3 text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(product.id, file);
              }}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
