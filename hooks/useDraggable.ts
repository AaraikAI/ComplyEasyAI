import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** localStorage key to persist position */
  storageKey: string;
  /** Default position (from bottom-right corner) */
  defaultPosition?: Position;
}

export function useDraggable({ storageKey, defaultPosition = { x: 24, y: 24 } }: UseDraggableOptions) {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the handle, ignore clicks on interactive children
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [role="button"]')) return;
    e.preventDefault();
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, posX: position.x, posY: position.y };
    hasDraggedRef.current = false;
    setIsDragging(true);
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;

      const newX = Math.max(0, dragStartRef.current.posX - dx);
      const newY = Math.max(0, dragStartRef.current.posY + dy);

      // Constrain to viewport
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      setPosition({ x: Math.min(newX, maxX), y: Math.min(newY, maxY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      // Persist position
      setPosition(pos => {
        try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch {}
        return pos;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, storageKey]);

  return {
    position,
    isDragging,
    hasDragged: hasDraggedRef,
    dragRef,
    handleMouseDown,
    style: {
      right: `${position.x}px`,
      bottom: `${position.y}px`,
    } as React.CSSProperties,
  };
}
