"use client";

import { Gift } from "lucide-react";
import { WheelCarousel, type WheelCarouselItem } from "@/components/ui/3d-wheel-carousel";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";

export type WishlistWheelItem = {
  variantId: string;
  productName: string;
  description: string;
  pricePaise: number;
  shippingPaise: number;
  type: string;
  imageUrl: string | null;
  available: number | null;
};

type Props<T extends WishlistWheelItem = WishlistWheelItem> = {
  items: T[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onGift: (item: T) => void;
  onDetails: (item: T) => void;
};

export function WishlistWheel<T extends WishlistWheelItem>({
  items,
  activeIndex,
  onActiveIndexChange,
  onGift,
  onDetails,
}: Props<T>) {
  if (items.length === 0) return null;

  const carouselItems: WheelCarouselItem[] = items.map((item) => ({
    id: item.variantId,
    label: item.productName,
    content: (
      <button
        type="button"
        className="flex h-full w-full flex-col overflow-hidden text-left glass-card-strong rounded-3xl shadow-2xl"
        onClick={() => onDetails(item)}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/20">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose/20 to-gold/10">
              <Gift className="h-12 w-12 text-gold/70" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
              {item.type === "DIGITAL" ? "Digital" : "Physical"}
            </span>
            <p className="font-serif mt-1 text-xl text-paper line-clamp-2">{item.productName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 p-4">
          <p className="font-serif text-2xl text-ink">{formatInr(item.pricePaise)}</p>
          {item.available === 0 && (
            <span className="text-xs font-medium text-rose">Out of stock</span>
          )}
        </div>
      </button>
    ),
  }));

  const active = items[activeIndex] ?? items[0];

  return (
    <div className="space-y-4">
      <div className="-mx-2 sm:mx-0">
        <WheelCarousel
          items={carouselItems}
          initialIndex={0}
          cardWidth={260}
          cardHeight={360}
          radius={480}
          mobileScale={0.72}
          autoRotateSpeed={6}
          pauseOnHover
          onActiveIndexChange={onActiveIndexChange}
          cardClassName="[--wheel-card-radius:1.25rem]"
          className="min-h-[22rem] sm:min-h-[26rem]"
          aria-label="Creator wishlist gifts"
        />
      </div>

      <div className="glass-card space-y-3 rounded-3xl p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Selected gift</p>
        <h2 className="font-serif text-2xl">{active.productName}</h2>
        {active.description && (
          <p className="text-sm leading-relaxed opacity-75 line-clamp-2">{active.description}</p>
        )}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onDetails(active)}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium opacity-80"
          >
            Details
          </button>
          <button
            type="button"
            disabled={active.available === 0}
            onClick={() => onGift(active)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper",
              "transition active:scale-[0.98] disabled:opacity-40",
            )}
          >
            <Gift className="h-4 w-4" />
            {active.available === 0 ? "Unavailable" : `Gift · ${formatInr(active.pricePaise)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
