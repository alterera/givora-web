"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";
import { api, ApiError, idempotencyKey } from "@/lib/api";
import { formatInr } from "@/lib/money";
import type { GiftView } from "@/lib/types";

const steps = ["Note", "Preview", "You", "Pay"];

export function CheckoutFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const variantId = params.get("variant") ?? "";
  const name = params.get("name") ?? "Gift";
  const price = Number(params.get("price") ?? 0);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("Thank you for inspiring me.");
  const [senderDisplayName, setSenderDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [revealTheme, setRevealTheme] = useState<"cinematic" | "playful">("cinematic");
  const [recipientNameHint, setRecipientNameHint] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  async function ensureSession() {
    try {
      await api("/api/v1/auth/me");
      return true;
    } catch {
      return false;
    }
  }

  async function sendOtp() {
    await api("/api/v1/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) });
    setOtpSent(true);
  }

  async function verifyOtp() {
    await api("/api/v1/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
    toast.success("You are in");
    setStep(3);
  }

  async function pay() {
    setBusy(true);
    try {
      if (!(await ensureSession())) {
        toast.error("Verify your number first");
        setStep(2);
        return;
      }
      const gift = await api<GiftView>("/api/v1/gifts", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("gift") },
        body: JSON.stringify({
          items: [{ variantId, quantity: 1 }],
          message,
          senderDisplayName: senderDisplayName || "A friend",
          isAnonymous,
          revealTheme,
          recipientNameHint,
          recipientPhone: recipientPhone || undefined,
        }),
      });
      const checkout = await api<{
        checkout: { sessionId: string; mode: "sandbox" | "production" };
      }>(`/api/v1/gifts/${gift.id}/checkout`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("checkout") },
        body: JSON.stringify({ phone: phone || undefined }),
      });
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({ mode: checkout.checkout.mode });
      await cashfree.checkout({ paymentSessionId: checkout.checkout.sessionId, redirectTarget: "_self" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Checkout could not start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-ink/60">
        Step {step + 1} of {steps.length} · {steps[step]}
      </p>
      <h1 className="font-serif mt-2 text-4xl">Gift {name}</h1>
      <p className="mt-2">{formatInr(price)} · shipping is confirmed by us, not the browser</p>

      {step === 0 && (
        <div className="mt-6 space-y-4">
          <TextArea label="Your note" value={message} onChange={(event) => setMessage(event.target.value)} />
          <Field label="How should they see you?" value={senderDisplayName} onChange={(event) => setSenderDisplayName(event.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
            Send it anonymously
          </label>
          <Field label="Their name (optional)" value={recipientNameHint} onChange={(event) => setRecipientNameHint(event.target.value)} />
          <Field label="Their WhatsApp (optional, locks the claim)" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} />
          <div className="flex gap-2">
            {(["cinematic", "playful"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${revealTheme === theme ? "bg-ink text-paper" : "border border-ink/15"}`}
                onClick={() => setRevealTheme(theme)}
              >
                {theme}
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => setStep(1)}>
            Preview the reveal
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className={`mt-6 rounded-[2rem] p-8 ${revealTheme === "cinematic" ? "bg-ink text-paper" : "bg-white"}`}>
          <p className="text-sm opacity-70">They will see</p>
          <p className="font-serif mt-6 text-3xl">“{message}”</p>
          <p className="mt-4">{isAnonymous ? "Someone special" : senderDisplayName || "A friend"}</p>
          <p className="mt-6 text-sm opacity-70">{name}</p>
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Edit
            </Button>
            <Button type="button" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-ink/70">If you already have a session, you can skip this. Otherwise verify on WhatsApp.</p>
          <Field label="Your mobile" value={phone} onChange={(event) => setPhone(event.target.value)} />
          {otpSent && <Field label="Code" value={code} onChange={(event) => setCode(event.target.value)} />}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => void ensureSession().then((ok) => (ok ? setStep(3) : toast.error("Verify first")))}>
              I am already signed in
            </Button>
            <Button type="button" onClick={() => void (otpSent ? verifyOtp() : sendOtp()).catch((error) => toast.error(error instanceof ApiError ? error.message : "Try again"))}>
              {otpSent ? "Verify" : "Send code"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-4">
          <p>
            {name} for {formatInr(price)}. You will pay on Cashfree, then come back here for the share link.
          </p>
          <Button type="button" disabled={busy || !variantId} onClick={() => void pay()}>
            {busy ? "Opening checkout…" : "Pay and create the link"}
          </Button>
          <button type="button" className="text-sm underline" onClick={() => router.push("/login?next=/checkout")}>
            Use a password instead
          </button>
        </div>
      )}
    </div>
  );
}
