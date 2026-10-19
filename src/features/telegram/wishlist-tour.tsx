"use client";

import { useEffect, useState } from "react";
import { EVENTS, Joyride, STATUS, type EventData, type Step } from "react-joyride";

const STORAGE_PREFIX = "givora-wishlist-tour:";

const steps: Step[] = [
  {
    target: "[data-tour='wishlist-header']",
    title: "You made it",
    content: "This is your creator's private wishlist. Only people with their link can see these gifts.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "[data-tour='wishlist-gallery']",
    title: "Browse their picks",
    content: "Swipe through the carousel to see what they actually want — each card is a real product they chose.",
    placement: "top",
  },
  {
    target: "[data-tour='wishlist-gift-cta']",
    title: "Send a gift",
    content: "Tap Gift this on any item you like. You pay once; they redeem privately and we handle delivery.",
    placement: "top",
  },
  {
    target: "[data-tour='wishlist-streak']",
    title: "Daily streak (optional)",
    content: "Show up for your creator with a small streak boost — totally optional, but fans love the flame.",
    placement: "left",
  },
  {
    target: "[data-tour='bottom-deck']",
    title: "Track what you send",
    content: "Use Sent in the menu below to see payment status, redemptions, and every gift you've given.",
    placement: "top",
  },
];

export function WishlistTour({ slug, enabled }: { slug: string; enabled: boolean }) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const key = STORAGE_PREFIX + slug;
    if (window.localStorage.getItem(key) === "done") return;
    const timer = window.setTimeout(() => setRun(true), 600);
    return () => window.clearTimeout(timer);
  }, [slug, enabled]);

  function onEvent(data: EventData) {
    if (data.type !== EVENTS.TOUR_END) return;
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      window.localStorage.setItem(STORAGE_PREFIX + slug, "done");
      setRun(false);
    }
  }

  if (!enabled) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={onEvent}
      locale={{ last: "Done", skip: "Skip tour" }}
      options={{
        showProgress: true,
        primaryColor: "#d4a853",
        backgroundColor: "rgba(28, 22, 30, 0.92)",
        textColor: "#faf5ee",
        arrowColor: "rgba(28, 22, 30, 0.92)",
        zIndex: 10000,
      }}
      styles={{
        tooltip: { borderRadius: 16, fontSize: 14 },
        buttonPrimary: { borderRadius: 9999, fontSize: 13 },
        buttonBack: { color: "rgba(250, 245, 238, 0.75)" },
      }}
    />
  );
}
