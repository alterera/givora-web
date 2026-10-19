import type { OrderRow } from "@/features/telegram/queries";

export type GiftFilterKey =
  | "all"
  | "awaiting_payment"
  | "sent"
  | "awaiting_redeem"
  | "redeemed"
  | "expired"
  | "refunded";

export type GiftDisplayStatus = {
  key: GiftFilterKey;
  label: string;
  hint: string;
  tone: "gold" | "rose" | "ink" | "muted";
};

function primaryGift(order: OrderRow) {
  return order.items[0]?.gift ?? null;
}

export function resolveGiftDisplayStatus(order: OrderRow): GiftDisplayStatus {
  const gift = primaryGift(order);
  const now = Date.now();
  const paymentExpired =
    order.status === "PENDING_PAYMENT" && new Date(order.paymentExpiresAt).getTime() < now;

  if (paymentExpired || order.status === "EXPIRED") {
    return {
      key: "expired",
      label: "Payment expired",
      hint: "This checkout window closed. Open the wishlist again to send a new gift.",
      tone: "muted",
    };
  }
  if (order.status === "PENDING_PAYMENT") {
    return {
      key: "awaiting_payment",
      label: "Awaiting payment",
      hint: "Complete checkout before the timer runs out.",
      tone: "rose",
    };
  }
  if (order.status === "FAILED") {
    return {
      key: "expired",
      label: "Payment failed",
      hint: "The payment did not go through.",
      tone: "muted",
    };
  }
  if (order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") {
    return {
      key: "refunded",
      label: "Refunded",
      hint: "This gift was refunded.",
      tone: "muted",
    };
  }

  const giftStatus = gift?.status;
  if (giftStatus === "EXPIRED") {
    return {
      key: "expired",
      label: "Gift expired",
      hint: "The creator did not redeem before the gift expired.",
      tone: "muted",
    };
  }
  if (giftStatus === "CANCELLED") {
    return {
      key: "expired",
      label: "Cancelled",
      hint: "This gift was cancelled.",
      tone: "muted",
    };
  }
  if (giftStatus === "AWAITING_REDEMPTION") {
    return {
      key: "awaiting_redeem",
      label: "Awaiting redeem",
      hint: "Paid — waiting for the creator to unwrap and claim it.",
      tone: "gold",
    };
  }
  if (giftStatus === "REDEEMED" || giftStatus === "FULFILLED") {
    return {
      key: "redeemed",
      label: giftStatus === "FULFILLED" ? "Fulfilled" : "Redeemed",
      hint: giftStatus === "FULFILLED" ? "Delivered or completed." : "The creator claimed your gift.",
      tone: "ink",
    };
  }

  if (order.status === "CONFIRMED") {
    return {
      key: "sent",
      label: "Gift sent",
      hint: "Payment received. We will update you when the creator redeems.",
      tone: "gold",
    };
  }

  return {
    key: "sent",
    label: order.status.replaceAll("_", " "),
    hint: "",
    tone: "muted",
  };
}

export function orderMatchesFilter(order: OrderRow, filter: GiftFilterKey): boolean {
  if (filter === "all") return true;
  const status = resolveGiftDisplayStatus(order);
  if (filter === "sent") return status.key === "sent" || status.key === "awaiting_redeem" || status.key === "redeemed";
  return status.key === filter;
}

export const GIFT_FILTERS: { key: GiftFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting_payment", label: "Pay pending" },
  { key: "awaiting_redeem", label: "Awaiting redeem" },
  { key: "redeemed", label: "Redeemed" },
  { key: "expired", label: "Expired" },
  { key: "refunded", label: "Refunded" },
];
