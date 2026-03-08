'use client';

import { useState } from 'react';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const today = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Erreur lors de l\'export CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        boxShadow: loading ? 'none' : '0 0 12px rgba(249, 115, 22, 0.35)',
      }}
    >
      {/* Shimmer on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)',
        }}
      />

      {loading ? (
        <>
          <span className="animate-spin text-base">⟳</span>
          <span>Export...</span>
        </>
      ) : (
        <>
          <span className="text-base">⬇</span>
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}
