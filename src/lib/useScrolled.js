import { useEffect, useRef, useState } from 'react'

// Has the page scrolled past a sentinel placed at the very top? Drives
// transparent-until-scrolled top bars: the hero gradient runs under the bar
// at rest, and the bar gains its blur/background (and small title) once the
// big header scrolls away.
export function useScrolledPast() {
  const ref = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, scrolled]
}
