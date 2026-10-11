"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, phone, password, displayName }),
      });
      toast.success("Account created. Check your email to verify it.");
      router.push("/account/gifts");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create the account");
    }
  }

  return (
    <form className="mx-auto max-w-md space-y-4 px-5 py-16" onSubmit={submit}>
      <h1 className="font-serif text-4xl">Create an account</h1>
      <Field label="Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label="Mobile" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <Button type="submit">Create account</Button>
    </form>
  );
}
