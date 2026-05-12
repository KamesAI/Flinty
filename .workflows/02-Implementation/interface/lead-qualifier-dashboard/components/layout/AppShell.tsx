"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppSidebar, useSidebarState } from "./AppSidebar";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function resolveShellMeta(pathname: string, title?: string, eyebrow?: string) {
  if (title) {
    return {
      title,
      eyebrow: eyebrow ?? title,
      showPageHeader: true,
    };
  }

  if (
    pathname === "/dashboard/campaigns" ||
    pathname === "/dashboard/campaigns/overview"
  ) {
    return {
      title: "Campagnes",
      eyebrow: "Campagnes",
      showPageHeader: false,
    };
  }

  if (pathname === "/dashboard/campaigns/suivi-detaille") {
    return {
      title: "Suivi détaillé",
      eyebrow: "Campagnes",
      showPageHeader: false,
    };
  }

  if (pathname.startsWith("/dashboard/campaigns")) {
    return {
      title: "Campagnes",
      eyebrow: "Campagnes",
      showPageHeader: true,
    };
  }

  if (pathname.startsWith("/dashboard/templates")) {
    return {
      title: "Studio emailing",
      eyebrow: "Configuration",
      showPageHeader: false,
    };
  }

  if (pathname.startsWith("/dashboard/inbox")) {
    return {
      title: "Conversations",
      eyebrow: "Messagerie",
      showPageHeader: false,
    };
  }

  if (pathname.startsWith("/dashboard/meetings")) {
    return {
      title: "Rendez-vous à venir",
      eyebrow: "Calendrier",
      showPageHeader: false,
    };
  }

  if (pathname.startsWith("/dashboard/data")) {
    return {
      title: "Tour de contrôle analytique",
      eyebrow: "Data",
      showPageHeader: false,
    };
  }

  return {
    title: "Dashboard",
    eyebrow: "Dashboard",
    showPageHeader: true,
  };
}

export function AppShell({ title, eyebrow, description, actions, children }: AppShellProps) {
  const { collapsed, toggle } = useSidebarState();
  const pathname = usePathname();
  const meta = resolveShellMeta(pathname, title, eyebrow);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed
              ? <PanelLeftOpen className="size-4" />
              : <PanelLeftClose className="size-4" />}
          </Button>
          <div className="text-xs text-muted-foreground">
            <span>Flinty</span>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-foreground">{meta.eyebrow}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
              <Bell className="size-4" />
            </Button>
          </div>
        </header>

        {/* Scroll area */}
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-glow opacity-60" />
          <motion.div
            key={meta.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-[1400px] px-6 py-8 lg:px-10"
          >
            {meta.showPageHeader ? (
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  {meta.eyebrow && (
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                      {meta.eyebrow}
                    </div>
                  )}
                  <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">{meta.title}</h1>
                  {description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            ) : null}
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
