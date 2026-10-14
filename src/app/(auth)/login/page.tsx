"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account/gifts";
  const [mode, setMode] = useState<"password" | "otp">(next.startsWith("/admin") ? "password" : "otp");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function sendCode() {
    try {
      await api("/api/v1/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) });
      setSent(true);
      toast.success("Code sent on WhatsApp");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the code");
    }
  }

  async function verify() {
    try {
      await api("/api/v1/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
      router.push(next);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That code did not work");
    }
  }

  async function passwordLogin(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
      router.push(next);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Sign in failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="glass-card rounded-3xl p-7">
        <h1 className="font-serif text-4xl">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/75">Guests can continue with a WhatsApp code. No account required to send or receive.</p>
        <div className="glass-subtle mt-6 flex rounded-full p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 font-medium transition ${mode === "otp" ? "bg-ink text-paper" : "text-ink/75"}`}
            onClick={() => setMode("otp")}
          >
            WhatsApp code
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 font-medium transition ${mode === "password" ? "bg-ink text-paper" : "text-ink/75"}`}
            onClick={() => setMode("password")}
          >
            Password
          </button>
        </div>
        {mode === "otp" ? (
          <div className="mt-6 space-y-4">
            <Field label="Mobile number" value={phone} onChange={(event) => setPhone(event.target.value)} />
            {sent && <Field label="Code" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" />}
            <Button type="button" className="w-full" onClick={sent ? verify : sendCode}>
              {sent ? "Continue" : "Send code"}
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={passwordLogin}>
            <Field label="Email or mobile" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
            <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-ink/75">
          <Link href="/register" className="underline">
            Create a password account
          </Link>
          {" · "}
          <Link href="/forgot-password" className="underline">
            Forgot password
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
