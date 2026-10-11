"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError, idempotencyKey } from "@/lib/api";

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  async function lookupPin(value: string) {
    setPostalCode(value);
    if (!/^\d{6}$/.test(value)) return;
    try {
      const place = await api<{ city: string; state: string }>(`/api/v1/public/pincode/${value}`);
      setCity(place.city);
      setState(place.state);
    } catch {
      toast.error("Check that PIN code");
    }
  }

  async function sendCode() {
    try {
      await api(`/api/v1/public/gifts/${params.token}/otp/request`, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      toast.success("Code sent");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the code");
    }
  }

  async function verify() {
    try {
      const result = await api<{ claimTicket: string }>(`/api/v1/public/gifts/${params.token}/otp/verify`, {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
      setTicket(result.claimTicket);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That code did not work");
    }
  }

  async function claim(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await api<{ orderNumber: string }>(`/api/v1/public/gifts/${params.token}/claim`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey("claim") },
        body: JSON.stringify({
          recipientName: name,
          phone,
          claimTicket: ticket,
          address: { line1, line2, city, state, postalCode, countryCode: "IN" },
        }),
      });
      setOrderNumber(result.orderNumber);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Claim failed");
    }
  }

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-serif text-4xl">It is yours</h1>
        <p className="mt-4">We will pack it under order {orderNumber}.</p>
        <button type="button" className="mt-6 underline" onClick={() => router.push("/")}>
          Back to Givora
        </button>
      </div>
    );
  }

  return (
    <form className="mx-auto max-w-lg space-y-4 px-5 py-12" onSubmit={claim}>
      <h1 className="font-serif text-4xl">Where should we send it?</h1>
      <Field label="Your name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Field label="Mobile" value={phone} onChange={(event) => setPhone(event.target.value)} required />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => void sendCode()}>
          Send code
        </Button>
        <Field label="Code" value={code} onChange={(event) => setCode(event.target.value)} />
        <Button type="button" onClick={() => void verify()}>
          Verify
        </Button>
      </div>
      <Field label="Address" value={line1} onChange={(event) => setLine1(event.target.value)} required />
      <Field label="Address line 2" value={line2} onChange={(event) => setLine2(event.target.value)} />
      <Field label="PIN code" value={postalCode} onChange={(event) => void lookupPin(event.target.value)} required />
      <Field label="City" value={city} onChange={(event) => setCity(event.target.value)} required />
      <Field label="State" value={state} onChange={(event) => setState(event.target.value)} required />
      <Button type="submit" disabled={!ticket}>
        Claim gift
      </Button>
    </form>
  );
}
