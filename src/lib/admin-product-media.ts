import { api } from "@/lib/api";

export async function uploadProductImage(productId: string, file: File) {
  const presign = await api<{ uploadUrl: string; publicUrl: string }>("/api/v1/admin/media/presign", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  return api<{ id: string; url: string }>(`/api/v1/admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify({ url: presign.publicUrl, alt: file.name }),
  });
}
