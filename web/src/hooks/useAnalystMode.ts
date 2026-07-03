import { useCallback, useState } from 'react'

const STORAGE_KEY = 'kiq-analyst-mode'

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Analyst mode: opt-in persisted UI preference that reveals raw joint
 * angles, the 3D pose panel, and per-rep angle detail. Normal mode
 * shows only coach-level concepts, score, and cues.
 *
 * Only this boolean preference persists — no movement data is stored.
 */
export function useAnalystMode(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(readStoredPreference)

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Preference persistence is best-effort; mode still works in-memory.
      }
      return next
    })
  }, [])

  return [enabled, toggle]
}
