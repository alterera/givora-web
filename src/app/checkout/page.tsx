import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutFlow />
    </Suspense>
  );
}
