import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kovoit-admin-theme'

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark'
  } catch {
    return false
  }
}

// Préférence d'affichage par navigateur (confort uniquement, aucune donnée sensible).
export function useDarkMode() {
  const [dark, setDark] = useState(readInitial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      // stockage indisponible : préférence non mémorisée
    }
  }, [dark])

  return { dark, toggle: () => setDark((value) => !value) }
}
