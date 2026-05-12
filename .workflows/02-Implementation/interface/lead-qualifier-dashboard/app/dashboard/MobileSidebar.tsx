"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 h-14 shrink-0 border-b border-zinc-800 bg-black">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
            K
          </div>
          <p className="text-white font-semibold text-sm">Flinty</p>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-56 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </aside>
    </>
  );
}
