"use client";

import { useEffect, useState } from "react";

const TOAST_KEY = "flinty.flash_toast";

export function FlashToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = sessionStorage.getItem(TOAST_KEY);
    if (msg) {
      sessionStorage.removeItem(TOAST_KEY);
      setMessage(msg);
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-500/30 bg-zinc-900 px-4 py-3 shadow-lg">
      <span className="text-green-400">✓</span>
      <span className="text-sm text-zinc-200">{message}</span>
    </div>
  );
}
