'use client'

import { useState, useEffect, ReactNode } from 'react'

interface CapsLockDetectorProps {
  children: (active: boolean) => ReactNode
}

/**
 * Enhanced caps lock detector that checks state on keyboard events
 * and attempts to detect on initial focus/click
 */
export function CapsLockDetector({ children }: CapsLockDetectorProps) {
  const [capsLockActive, setCapsLockActive] = useState(false)

  useEffect(() => {
    const handleKeyEvent = (e: KeyboardEvent) => {
      // getModifierState works reliably on keyboard events
      if (e.getModifierState) {
        const isCapsLock = e.getModifierState('CapsLock')
        setCapsLockActive(isCapsLock)
      }
    }

    const handleMouseOrFocus = (e: Event) => {
      // Try to detect caps lock on mouse/focus events
      // This is less reliable but can work in some browsers
      if ('getModifierState' in e && typeof e.getModifierState === 'function') {
        try {
          // Cast to MouseEvent or KeyboardEvent which have getModifierState
          const eventWithModifier = e as MouseEvent | KeyboardEvent
          const isCapsLock = eventWithModifier.getModifierState('CapsLock')
          setCapsLockActive(isCapsLock)
        } catch (_err) {
          // Some browsers don't support this on non-keyboard events
          console.debug('CapsLock detection not available on this event')
        }
      }
    }

    // Listen globally for keyboard events
    window.addEventListener('keydown', handleKeyEvent)
    window.addEventListener('keyup', handleKeyEvent)
    window.addEventListener('keypress', handleKeyEvent)

    // Also listen for mouse/focus events (less reliable but worth trying)
    window.addEventListener('mousedown', handleMouseOrFocus)
    window.addEventListener('click', handleMouseOrFocus)
    window.addEventListener('focus', handleMouseOrFocus, true)

    return () => {
      window.removeEventListener('keydown', handleKeyEvent)
      window.removeEventListener('keyup', handleKeyEvent)
      window.removeEventListener('keypress', handleKeyEvent)
      window.removeEventListener('mousedown', handleMouseOrFocus)
      window.removeEventListener('click', handleMouseOrFocus)
      window.removeEventListener('focus', handleMouseOrFocus, true)
    }
  }, [])

  return <>{children(capsLockActive)}</>
}
