"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

function ForgotForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      toast.success("If that email exists, a reset link is on its way.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the reset");
    }
  }

  async function reset(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
      toast.success("Password updated. You can sign in.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Reset failed");
    }
  }

  if (token) {
    return (
      <form className="mx-auto max-w-md space-y-4 px-5 py-16" onSubmit={reset}>
        <h1 className="font-serif text-4xl">Choose a new password</h1>
        <Field label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit">Update password</Button>
      </form>
    );
  }

  return (
    <form className="mx-auto max-w-md space-y-4 px-5 py-16" onSubmit={requestReset}>
      <h1 className="font-serif text-4xl">Reset your password</h1>
      <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Button type="submit">Send reset link</Button>
    </form>
  );
}

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
