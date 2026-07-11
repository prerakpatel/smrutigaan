// Small inline icon set (Feather-style, MIT) so we don't need an icon dependency.

function I({ size = 24, sw = 1.8, className = '', filled = false, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const BookOpen = (p) => (
  <I {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </I>
)

export const Music = (p) => (
  <I {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </I>
)

export const Cog = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </I>
)

export const Heart = (p) => (
  <I {...p}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </I>
)

export const ChevronLeft = (p) => (
  <I {...p}>
    <polyline points="15 18 9 12 15 6" />
  </I>
)

export const ChevronRight = (p) => (
  <I {...p}>
    <polyline points="9 18 15 12 9 6" />
  </I>
)

export const Ellipsis = (p) => (
  <I {...p} filled>
    <circle cx="5" cy="12" r="1.6" stroke="none" />
    <circle cx="12" cy="12" r="1.6" stroke="none" />
    <circle cx="19" cy="12" r="1.6" stroke="none" />
  </I>
)

export const Plus = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
)

export const SearchIcon = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </I>
)

export const X = (p) => (
  <I {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
)

export const Pencil = (p) => (
  <I {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </I>
)

export const ShareIcon = (p) => (
  <I {...p}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </I>
)

export const Trash = (p) => (
  <I {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </I>
)

export const Check = (p) => (
  <I {...p}>
    <polyline points="20 6 9 17 4 12" />
  </I>
)

export const Minus = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
)

export const Maximize = (p) => (
  <I {...p}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </I>
)

export const Minimize = (p) => (
  <I {...p}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </I>
)

export const Bookmark = (p) => (
  <I {...p}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </I>
)

export const Copy = (p) => (
  <I {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </I>
)

export const Highlighter = (p) => (
  <I {...p}>
    <path d="m9 11-6 6v3h9l3-3" />
    <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8z" />
  </I>
)

export const ChevronDown = (p) => (
  <I {...p}>
    <polyline points="6 9 12 15 18 9" />
  </I>
)

export const Play = (p) => (
  <I {...p} filled>
    <polygon points="6 3.5 20 12 6 20.5 6 3.5" stroke="none" />
  </I>
)

export const Pause = (p) => (
  <I {...p} filled>
    <rect x="5.5" y="4" width="4.5" height="16" rx="1.2" stroke="none" />
    <rect x="14" y="4" width="4.5" height="16" rx="1.2" stroke="none" />
  </I>
)

export const SkipBack = (p) => (
  <I {...p} filled>
    <polygon points="19 20 9 12 19 4 19 20" stroke="none" />
    <rect x="4" y="4" width="2.4" height="16" rx="1" stroke="none" />
  </I>
)

export const SkipForward = (p) => (
  <I {...p} filled>
    <polygon points="5 4 15 12 5 20 5 4" stroke="none" />
    <rect x="17.6" y="4" width="2.4" height="16" rx="1" stroke="none" />
  </I>
)
