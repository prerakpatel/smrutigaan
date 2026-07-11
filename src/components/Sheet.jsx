// Bottom sheet — the mobile-native replacement for inline panels and dialogs.
// Slides up from the bottom edge, dims the page behind it, closes on backdrop tap.
// Rendered through a portal: sheets open from inside stacked pages (z-30),
// whose stacking context would otherwise trap them below the z-50 tab bar —
// covering the sheet's bottom and stealing its taps.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize, Minimize } from './icons'

export default function Sheet({ open, onClose, title, expandable = false, children }) {
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (!open) setFull(false)
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`animate-sheet-up absolute inset-x-0 bottom-0 mx-auto max-w-2xl overflow-y-auto overscroll-contain border-t border-veil/10 bg-surface shadow-2xl ${
          full ? 'top-0 rounded-none' : 'max-h-[85dvh] rounded-t-3xl'
        }`}
      >
        <div
          className={`sticky top-0 z-10 bg-surface pb-1 ${
            full ? 'pt-safe rounded-none' : 'rounded-t-3xl pt-3'
          }`}
        >
          {!full && <div className="mx-auto h-1 w-10 rounded-full bg-veil/20" />}
          <div className="flex min-h-[36px] items-center justify-between pl-5 pr-2 pt-2">
            {title ? (
              <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
            ) : (
              <span />
            )}
            {expandable && (
              <button
                onClick={() => setFull((f) => !f)}
                aria-label={full ? 'Collapse sheet' : 'Expand sheet to full page'}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-card"
              >
                {full ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            )}
          </div>
        </div>
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-1">{children}</div>
      </div>
    </div>,
    document.body
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
