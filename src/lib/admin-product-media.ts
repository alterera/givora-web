import { api } from "@/lib/api";

export async function uploadProductImage(productId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const uploaded = await api<{ publicUrl: string }>("/api/v1/admin/media/upload-image", {
    method: "POST",
    body: form,
  });
  return api<{ id: string; url: string }>(`/api/v1/admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify({ url: uploaded.publicUrl, alt: file.name }),
  });
}
