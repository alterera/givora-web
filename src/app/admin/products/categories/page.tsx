"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

type OccasionRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: { products: number };
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function AdminCatalogTaxonomyPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api<CategoryRow[]>("/api/v1/admin/categories"),
  });
  const occasionsQuery = useQuery({
    queryKey: ["admin-occasions"],
    queryFn: () => api<OccasionRow[]>("/api/v1/admin/occasions"),
  });

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [occName, setOccName] = useState("");
  const [occSlug, setOccSlug] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-occasions"] });
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: catName.trim(),
          slug: catSlug.trim() || slugify(catName),
          isActive: true,
        }),
      });
      setCatName("");
      setCatSlug("");
      toast.success("Category created");
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createOccasion(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/v1/admin/occasions", {
        method: "POST",
        body: JSON.stringify({
          name: occName.trim(),
          slug: occSlug.trim() || slugify(occName),
          isActive: true,
        }),
      });
      setOccName("");
      setOccSlug("");
      toast.success("Occasion created");
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(row: CategoryRow) {
    try {
      await api(`/api/v1/admin/categories/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  }

  async function deleteCategory(row: CategoryRow) {
    if (!window.confirm(`Delete category "${row.name}"?`)) return;
    try {
      await api(`/api/v1/admin/categories/${row.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    }
  }

  async function toggleOccasion(row: OccasionRow) {
    try {
      await api(`/api/v1/admin/occasions/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  }

  async function deleteOccasion(row: OccasionRow) {
    if (!window.confirm(`Delete occasion "${row.name}"?`)) return;
    try {
      await api(`/api/v1/admin/occasions/${row.id}`, { method: "DELETE" });
      toast.success("Occasion deleted");
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    }
  }

  const categories = categoriesQuery.data ?? [];
  const occasions = occasionsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>
      <AdminPageHeader title="Categories & occasions" description="Organise the catalogue for filtering and merchandising." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Categories</h2>
          <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={createCategory}>
            <Field label="Name" value={catName} onChange={(e) => { setCatName(e.target.value); if (!catSlug) setCatSlug(slugify(e.target.value)); }} required />
            <Field label="Slug" value={catSlug} onChange={(e) => setCatSlug(slugify(e.target.value))} required />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="text-sm">
                <Plus className="h-4 w-4" />
                Add category
              </Button>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border text-sm">
            {categories.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">/{row.slug} · {row._count.products} products</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void toggleCategory(row)}>
                    {row.isActive ? "Active" : "Hidden"}
                  </Button>
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void deleteCategory(row)} disabled={row._count.products > 0}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard className="p-6">
          <h2 className="font-serif text-xl">Occasions</h2>
          <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={createOccasion}>
            <Field label="Name" value={occName} onChange={(e) => { setOccName(e.target.value); if (!occSlug) setOccSlug(slugify(e.target.value)); }} required />
            <Field label="Slug" value={occSlug} onChange={(e) => setOccSlug(slugify(e.target.value))} required />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="text-sm">
                <Plus className="h-4 w-4" />
                Add occasion
              </Button>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border text-sm">
            {occasions.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">/{row.slug} · {row._count.products} products</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void toggleOccasion(row)}>
                    {row.isActive ? "Active" : "Hidden"}
                  </Button>
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => void deleteOccasion(row)} disabled={row._count.products > 0}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}
