"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { tgApi } from "@/lib/tg-api";
import { Field, TextArea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ApplyPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [personaDisclosure, setPersonaDisclosure] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await tgApi("/api/v1/creators/me", {
        method: "POST",
        body: JSON.stringify({ displayName, slug, bio, giftNote, personaDisclosure: personaDisclosure || undefined }),
      });
      toast.success("Application sent. An admin will approve your wishlist.");
      router.push("/tg/creator");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not apply");
    }
  }

  return (
    <form className="space-y-4 px-5 py-8" onSubmit={submit}>
      <h1 className="font-serif text-4xl">Create your wishlist</h1>
      <Field label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      <Field label="Public name (sophia)" value={slug} onChange={(event) => setSlug(event.target.value)} required />
      <TextArea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
      <TextArea label="Gift note" value={giftNote} onChange={(event) => setGiftNote(event.target.value)} />
      <TextArea label="Persona disclosure, if you are not a real person" value={personaDisclosure} onChange={(event) => setPersonaDisclosure(event.target.value)} />
      <Button type="submit">Submit for approval</Button>
    </form>
  );
}
