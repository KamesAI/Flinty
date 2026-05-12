"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
    >
      {copied ? (
        <Check size={12} className="text-green-400" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}
