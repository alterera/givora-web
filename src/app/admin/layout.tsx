"use client";

import { AdminNav } from "@/components/admin/admin-nav";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell fixed inset-0 z-20 overflow-auto bg-admin-canvas text-foreground">
      <SidebarProvider defaultOpen>
        <Sidebar>
          <AdminNav />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-admin-canvas/95 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger />
            <p className="text-sm text-muted-foreground">GivoraWorld operations</p>
          </header>
          <div className="flex-1 p-4 md:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
