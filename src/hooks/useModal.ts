/**
 * 自定义 Hook: 管理 Modal 状态
 */

import { useState, useCallback } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * 自定义 Hook: 管理多个 Modal
 */
export function useModals<T extends string>() {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());

  const open = useCallback((key: T) => {
    setOpenModals(prev => new Set(prev).add(key));
  }, []);

  const close = useCallback((key: T) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const isOpen = useCallback((key: T) => openModals.has(key), [openModals]);

  return {
    open,
    close,
    isOpen,
  };
}
