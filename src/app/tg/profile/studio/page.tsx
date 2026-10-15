"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuraStudioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tg/aura");
  }, [router]);
  return null;
}
