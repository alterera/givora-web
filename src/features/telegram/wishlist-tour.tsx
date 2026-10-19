"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENTS, Joyride, STATUS, type EventData, type Step } from "react-joyride";

const STORAGE_PREFIX = "givora-wishlist-tour:";

type WishlistTourProps = {
  slug: string;
  enabled: boolean;
  paused?: boolean;
  creatorName: string;
};

export function WishlistTour({ slug, enabled, paused = false, creatorName }: WishlistTourProps) {
  const [run, setRun] = useState(false);

  const steps = useMemo<Step[]>(
    () => [
      {
        target: "[data-tour='wishlist-greeting']",
        title: `Welcome to ${creatorName}'s list`,
        content: "This wishlist is private — you only see it because you opened their invite link.",
        skipBeacon: true,
        placement: "bottom",
        offset: 12,
      },
      {
        target: "[data-tour='wishlist-gallery-frame']",
        title: "Swipe to explore",
        content: "Drag the carousel left or right. Each card is something they picked themselves.",
        placement: "bottom",
        offset: 10,
        spotlightPadding: 8,
      },
      {
        target: "[data-tour='wishlist-gift-anchor']",
        title: "Send a gift",
        content: "On the front card, tap Gift this. Checkout is secure and their address stays private.",
        placement: "top",
        offset: 14,
        spotlightPadding: 6,
        isFixed: true,
      },
      {
        target: "[data-tour='wishlist-streak']",
        title: "Streak flame",
        content: "Optional: open the flame to keep a daily streak with this creator.",
        placement: "bottom-end",
        offset: 10,
      },
      {
        target: "[data-tour='bottom-deck-sent']",
        title: "Sent gifts",
        content: "Tap Sent here anytime to filter and track payment, redeem, and delivery status.",
        placement: "top",
        offset: 12,
        isFixed: true,
        spotlightPadding: 4,
      },
    ],
    [creatorName],
  );

  useEffect(() => {
    if (!enabled || paused || typeof window === "undefined") {
      setRun(false);
      return;
    }
    const key = STORAGE_PREFIX + slug;
    if (window.localStorage.getItem(key) === "done") return;

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const greeting = document.querySelector("[data-tour='wishlist-greeting']");
      const gallery = document.querySelector("[data-tour='wishlist-gallery-frame']");
      if (!greeting || !gallery) {
        window.setTimeout(start, 200);
        return;
      }
      setRun(true);
    };

    const timer = window.setTimeout(start, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, enabled, paused]);

  function onEvent(data: EventData) {
    if (data.type === EVENTS.TARGET_NOT_FOUND) {
      return;
    }
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
      scrollToFirstStep={false}
      onEvent={onEvent}
      locale={{ last: "Done", skip: "Skip tour" }}
      options={{
        showProgress: true,
        primaryColor: "#d4a853",
        backgroundColor: "rgba(28, 22, 30, 0.94)",
        textColor: "#faf5ee",
        arrowColor: "rgba(28, 22, 30, 0.94)",
        overlayColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 10000,
        spotlightRadius: 14,
        scrollDuration: 280,
      }}
      styles={{
        tooltip: { borderRadius: 16, fontSize: 14, maxWidth: 300 },
        buttonPrimary: { borderRadius: 9999, fontSize: 13 },
        buttonBack: { color: "rgba(250, 245, 238, 0.75)" },
      }}
    />
  );
}
