// Bottom sheet — the mobile-native replacement for inline panels and dialogs.
// Slides up from the bottom edge, dims the page behind it, closes on backdrop tap.

export default function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="animate-sheet-up absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto overscroll-contain rounded-t-3xl border-t border-white/10 bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-3xl bg-surface pb-1 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
          {title && (
            <h3 className="mt-3 px-5 font-display text-lg font-bold tracking-tight">{title}</h3>
          )}
        </div>
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2">{children}</div>
      </div>
    </div>
  )
}

// A tappable row inside a sheet — 48px minimum height, full-width hit area.
export function SheetRow({ onClick, icon, danger = false, children, trailing }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base transition-colors active:bg-card ${
        danger ? 'text-punch' : 'text-snow'
      }`}
    >
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing}
    </button>
  )
}
