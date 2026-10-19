"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type DockItem = {
  id: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
  badge?: number;
  items?: DockItem[];
};

type DockProps = {
  items: DockItem[];
  value?: string | null;
  onValueChange?: (id: string) => void;
  onItemsChange?: (items: DockItem[], change: { type: "move"; id: string; index: number }) => void;
  label?: string;
  className?: string;
};

function accessibleName(item: DockItem, selectedId: string | null | undefined) {
  const shown = item.items?.find((child) => child.id === selectedId) ?? item.items?.[0];
  const selected = holdsValue(item, selectedId);
  const base = item.items?.length
    ? `${item.label}${shown ? `: ${shown.label}` : ""}${shown?.shortcut ? `, ${shown.shortcut}` : ""}`
    : `${item.label}${item.shortcut ? `, ${item.shortcut}` : ""}`;
  const count = item.badge && item.badge > 0 ? `, ${item.badge}` : "";
  return `${base}${count}${selected ? ", selected" : ""}`;
}

function holdsValue(item: DockItem, value: string | null | undefined) {
  if (!value) return false;
  if (item.id === value) return true;
  return Boolean(item.items?.some((child) => child.id === value));
}

export function Dock({
  items,
  value = null,
  onValueChange,
  onItemsChange,
  label = "Tools",
  className,
}: DockProps) {
  const reduce = useReducedMotion();
  const barId = useId();
  const trayId = useId();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [trayFocus, setTrayFocus] = useState(0);
  const [labelWarm, setLabelWarm] = useState(false);

  const openItem = items.find((item) => item.id === openGroup && item.items?.length);
  const labelIndex = hover;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function focusItem(index: number) {
    const next = (index + items.length) % items.length;
    setFocusIndex(next);
    itemRefs.current[next]?.focus();
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (!onItemsChange) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    onItemsChange(next, { type: "move", id: moved.id, index: target });
    setFocusIndex(target);
    requestAnimationFrame(() => itemRefs.current[target]?.focus());
  }

  function choose(item: DockItem) {
    if (item.items?.length) {
      const current = item.items.find((child) => child.id === value) ?? item.items[0];
      if (current) onValueChange?.(current.id);
      setOpenGroup((prev) => (prev === item.id ? null : item.id));
      setTrayFocus(Math.max(0, item.items.findIndex((child) => child.id === (current?.id ?? ""))));
      return;
    }
    onValueChange?.(item.id);
    setOpenGroup(null);
  }

  function onBarKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    const item = items[index];
    if (!item) return;
    if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      moveItem(index, event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
    } else if (event.key === "ArrowUp" && item.items?.length) {
      event.preventDefault();
      setOpenGroup(item.id);
      const selected = Math.max(0, item.items.findIndex((child) => child.id === value));
      setTrayFocus(selected);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(item);
    }
  }

  function onTrayKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!openItem?.items) return;
    const members = openItem.items;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setTrayFocus((prev) => {
        const next = event.key === "ArrowLeft" ? prev - 1 : prev + 1;
        return (next + members.length) % members.length;
      });
    } else if (event.key === "ArrowDown" || event.key === "Escape" || event.key === "Tab") {
      if (event.key !== "Tab") event.preventDefault();
      setOpenGroup(null);
      const index = items.findIndex((item) => item.id === openItem.id);
      itemRefs.current[index]?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const member = members[trayFocus];
      if (member) {
        onValueChange?.(member.id);
        setOpenGroup(null);
        const index = items.findIndex((item) => item.id === openItem.id);
        itemRefs.current[index]?.focus();
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative mx-auto w-full max-w-full", className)}>
      <AnimatePresence>
        {openItem?.items && (
          <motion.div
            id={trayId}
            role="group"
            aria-label={openItem.label}
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 32 }}
            className="glass-card-strong absolute bottom-[calc(100%+0.55rem)] left-1/2 flex -translate-x-1/2 gap-1 rounded-2xl p-1.5"
            onKeyDown={onTrayKeyDown}
          >
            {openItem.items.map((member, index) => {
              const selected = member.id === value;
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-ink",
                    selected ? "bg-ink text-paper" : "text-ink/80",
                  )}
                  onClick={() => {
                    onValueChange?.(member.id);
                    setOpenGroup(null);
                  }}
                  ref={(node) => {
                    if (index === trayFocus) node?.focus();
                  }}
                >
                  <span className="[&_svg]:size-4" aria-hidden>
                    {member.icon}
                  </span>
                  <span className="sr-only">{member.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        role="toolbar"
        aria-label={label}
        aria-controls={openItem ? trayId : undefined}
        id={barId}
        className="glass-card-strong flex w-full max-w-full items-end justify-between gap-1 overflow-x-auto rounded-full px-2 py-2"
        onMouseLeave={() => {
          setHover(null);
          setLabelWarm(false);
        }}
      >
        {items.map((item, index) => {
          const selected = holdsValue(item, value);
          const shown = item.items?.find((child) => child.id === value) ?? item.items?.[0];
          const name = accessibleName(item, value);
          return (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="button"
              aria-pressed={item.items ? undefined : selected}
              aria-haspopup={item.items ? "true" : undefined}
              aria-expanded={item.items ? openGroup === item.id : undefined}
              aria-controls={item.items && openGroup === item.id ? trayId : undefined}
              aria-label={item.items && shown ? `${item.label}: ${shown.label}${selected ? ", selected" : ""}` : name}
              tabIndex={index === focusIndex ? 0 : -1}
              className="relative flex h-11 min-w-[3.25rem] flex-1 touch-pan-y items-center justify-center rounded-full text-ink outline-none focus-visible:ring-2 focus-visible:ring-gold/70 sm:min-w-[3.5rem]"
              onFocus={() => {
                setFocusIndex(index);
                setHover(index);
                setLabelWarm(true);
              }}
              onMouseEnter={() => {
                setHover(index);
                window.setTimeout(() => setLabelWarm(true), labelWarm ? 0 : 180);
              }}
              onKeyDown={(event) => onBarKeyDown(event, index)}
              onClick={() => choose(item)}
            >
              {selected && (
                <motion.span
                  layoutId="givora-dock-selection"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 460, damping: 34 }}
                />
              )}
              <span className={cn("relative z-10 [&_svg]:size-[18px]", selected ? "text-paper" : "text-ink/80")} aria-hidden>
                {shown && item.items ? shown.icon : item.icon}
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute right-1 top-1 z-10 min-w-4 rounded-full bg-rose px-1 text-[9px] font-semibold text-paper">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {labelIndex !== null && items[labelIndex] && labelWarm && (
          <motion.div
            key={items[labelIndex].id}
            aria-hidden
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] text-[11px] font-medium tracking-wide text-ink"
            style={{ left: `calc(${((labelIndex + 0.5) / items.length) * 100}% )`, transform: "translateX(-50%)" }}
          >
            <span className="glass-card-strong rounded-full px-2.5 py-1">{items[labelIndex].label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
