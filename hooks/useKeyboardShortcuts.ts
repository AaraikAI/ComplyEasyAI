import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Keyboard shortcut definition.
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display label for the shortcut */
  label: string;
  /** Description of what the shortcut does */
  description: string;
  /** Key to press (lowercase, e.g. 'k', '/', 'n', 'escape') */
  key: string;
  /** Whether Cmd (Mac) / Ctrl (Win/Linux) is required */
  meta?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt/Option is required */
  alt?: boolean;
  /** Category for grouping in help dialog */
  category: string;
  /** Handler function */
  handler: () => void;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * Formatted shortcut key display string.
 */
export interface ShortcutDisplay {
  id: string;
  label: string;
  description: string;
  keys: string;
  category: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const META_KEY = isMac ? 'metaKey' : 'ctrlKey';
const META_SYMBOL = isMac ? '\u2318' : 'Ctrl';
const SHIFT_SYMBOL = isMac ? '\u21E7' : 'Shift';
const ALT_SYMBOL = isMac ? '\u2325' : 'Alt';

/**
 * Format a shortcut for display purposes.
 */
function formatShortcutKeys(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.meta) parts.push(META_SYMBOL);
  if (shortcut.shift) parts.push(SHIFT_SYMBOL);
  if (shortcut.alt) parts.push(ALT_SYMBOL);

  // Map special keys to display symbols
  const keyMap: Record<string, string> = {
    escape: 'Esc',
    enter: '\u23CE',
    arrowup: '\u2191',
    arrowdown: '\u2193',
    arrowleft: '\u2190',
    arrowright: '\u2192',
    backspace: '\u232B',
    delete: '\u2326',
    tab: '\u21E5',
    ' ': 'Space',
  };

  const displayKey = keyMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(displayKey);

  return parts.join(isMac ? '' : '+');
}

/**
 * Check if the current active element is an input-like element
 * where keyboard shortcuts should not fire.
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check for contenteditable
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check for role="textbox"
  if (activeElement.getAttribute('role') === 'textbox') {
    return true;
  }

  return false;
}

/**
 * Global keyboard shortcut manager hook.
 *
 * Registers keyboard shortcuts with Cmd/Ctrl key combos.
 * Manages shortcuts registry, prevents conflicts with text inputs.
 * Returns all registered shortcuts for display in help dialog.
 *
 * Usage:
 *   const { registerShortcut, unregisterShortcut, getAllShortcuts, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();
 *
 *   useEffect(() => {
 *     registerShortcut({
 *       id: 'search',
 *       label: 'Search',
 *       description: 'Open global search',
 *       key: 'k',
 *       meta: true,
 *       category: 'Navigation',
 *       handler: () => openSearch(),
 *     });
 *     return () => unregisterShortcut('search');
 *   }, []);
 */
export const useKeyboardShortcuts = () => {
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current.set(shortcut.id, { enabled: true, ...shortcut });
    forceUpdate(n => n + 1);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
    forceUpdate(n => n + 1);
  }, []);

  const enableShortcut = useCallback((id: string) => {
    const shortcut = shortcutsRef.current.get(id);
    if (shortcut) {
      shortcut.enabled = true;
      shortcutsRef.current.set(id, shortcut);
    }
  }, []);

  const disableShortcut = useCallback((id: string) => {
    const shortcut = shortcutsRef.current.get(id);
    if (shortcut) {
      shortcut.enabled = false;
      shortcutsRef.current.set(id, shortcut);
    }
  }, []);

  const getAllShortcuts = useCallback((): ShortcutDisplay[] => {
    const displays: ShortcutDisplay[] = [];
    shortcutsRef.current.forEach(shortcut => {
      if (shortcut.enabled !== false) {
        displays.push({
          id: shortcut.id,
          label: shortcut.label,
          description: shortcut.description,
          keys: formatShortcutKeys(shortcut),
          category: shortcut.category,
        });
      }
    });
    return displays.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
  }, []);

  const getShortcutsByCategory = useCallback((): Record<string, ShortcutDisplay[]> => {
    const all = getAllShortcuts();
    const grouped: Record<string, ShortcutDisplay[]> = {};
    all.forEach(shortcut => {
      if (!grouped[shortcut.category]) grouped[shortcut.category] = [];
      grouped[shortcut.category].push(shortcut);
    });
    return grouped;
  }, [getAllShortcuts]);

  // Register the built-in help shortcut (Cmd+/)
  useEffect(() => {
    registerShortcut({
      id: '__keyboard-help',
      label: 'Keyboard Shortcuts',
      description: 'Show all keyboard shortcuts',
      key: '/',
      meta: true,
      category: 'Help',
      handler: () => setIsHelpOpen(prev => !prev),
    });

    return () => {
      unregisterShortcut('__keyboard-help');
    };
  }, [registerShortcut, unregisterShortcut]);

  // Global keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if target is an input element (unless meta key is held)
      const metaHeld = e[META_KEY];
      if (isInputFocused() && !metaHeld) return;

      const pressedKey = e.key.toLowerCase();

      // Iterate through all registered shortcuts to find a match
      for (const shortcut of shortcutsRef.current.values()) {
        if (shortcut.enabled === false) continue;

        const keyMatches = pressedKey === shortcut.key.toLowerCase();
        const metaMatches = shortcut.meta ? e[META_KEY] : !e[META_KEY];
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatches = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatches && metaMatches && shiftMatches && altMatches) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut,
    getAllShortcuts,
    getShortcutsByCategory,
    isHelpOpen,
    setIsHelpOpen,
    META_SYMBOL,
    SHIFT_SYMBOL,
    ALT_SYMBOL,
  };
};

export default useKeyboardShortcuts;
