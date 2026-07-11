import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Dark-mode state for the standalone reference pages (health.html / matrix.html).
 * Mirrors App.tsx's toggle+persist logic so the three entry points agree on the
 * same 'theme' localStorage key and .dark class toggle; initial value is read from
 * the class the pre-render script in each *.html already applied (avoids flash).
 */
export function useDarkMode(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* 保存できなくても表示は切り替わる */
    }
  }, [dark])
  return [dark, setDark]
}
