export type Variant = {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  compareAtPaise: number | null;
  available: number;
  lowStock: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  story: string | null;
  giftedCount: number;
  category: { name: string; slug: string } | null;
  occasion: { name: string; slug: string } | null;
  images: Array<{ url: string; alt: string | null }>;
  variants: Variant[];
};

export type Catalogue = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
};

export type GiftView = {
  id: string;
  publicRef: string;
  status: string;
  message: string;
  senderDisplayName: string;
  isAnonymous: boolean;
  revealTheme: string;
  recipientNameHint: string | null;
  totalPaise: number;
  subtotalPaise: number;
  shippingPaise: number;
  paymentExpiresAt: string;
  claimExpiresAt: string | null;
  openedAt: string | null;
  claimedAt: string | null;
  items: Array<{ productName: string; variantName: string; quantity: number; imageUrl: string | null }>;
  timeline: Array<{ type: string; status: string | null; at: string }>;
  fulfilment: { orderNumber: string; status: string; carrier: string | null; trackingRef: string | null } | null;
};

export type RevealGift = {
  status: string;
  message: string;
  from: string;
  theme: string;
  recipientNameHint: string | null;
  phoneLocked: boolean;
  claimExpiresAt: string | null;
  items: Array<{ productName: string; variantName: string; imageUrl: string | null; quantity: number }>;
  fulfilmentStatus: string | null;
};

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  role: "CUSTOMER" | "ADMIN";
  hasPassword: boolean;
};
