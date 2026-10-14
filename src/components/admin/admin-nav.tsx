"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Package,
  Palette,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/creators", label: "Creators & Users", icon: Users },
  { href: "/admin/products", label: "Catalogue", icon: Package },
  { href: "/admin/orders", label: "Shipments", icon: Truck },
];

const platformNav = [
  { href: "/admin/payments", label: "Payment refunds", icon: CreditCard },
  { href: "/admin/cosmetics", label: "Aura Cosmetics", icon: Palette },
  { href: "/admin/aura", label: "Aura Adjustments", icon: Sparkles },
  { href: "/admin/audit", label: "Audit log", icon: ClipboardList },
];

export function AdminNav() {
  const path = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return path === href;
    return path === href || path.startsWith(`${href}/`);
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
          <span className="font-serif text-xl tracking-tight">Givora</span>
          <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            Admin
          </span>
        </Link>
        <p className="px-2 text-xs text-sidebar-foreground/60">Operations console</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {platformNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span>View storefront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/login">
                <span className="text-xs text-sidebar-foreground/70">Account / sign in</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
