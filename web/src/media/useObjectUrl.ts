/**
 * Object-URL lifecycle for a Blob (P3).
 *
 * Every `URL.createObjectURL` pins its Blob in memory until it is revoked, so
 * a video blob leaked this way costs tens of megabytes for the lifetime of the
 * tab. This hook makes the lifetime explicit and tied to the component that
 * needs it: one URL per blob, revoked when the blob changes or the component
 * unmounts.
 *
 * Returns null for a null blob so callers can render a capability-gated
 * placeholder without branching on the URL themselves.
 */
import { useEffect, useState } from 'react'

export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const created = URL.createObjectURL(blob)
    setUrl(created)
    return () => {
      // Revoke on every change, not only on unmount — swapping sessions
      // without this leaks the previous session's video for the whole tab.
      URL.revokeObjectURL(created)
      setUrl(null)
    }
  }, [blob])

  return url
}
