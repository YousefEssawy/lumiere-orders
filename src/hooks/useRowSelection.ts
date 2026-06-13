"use client";
import { useCallback, useState } from "react";

/**
 * تحديد صفوف في جدول بـ Set<string> من المعرّفات — المنطق المشترك بين كل
 * الصفحات اللي فيها select-row + select-all + bulk action.
 *
 * `items` هي الصفوف اللي في نطاق التحديد الحالي: المفلترة لو فيه فلتر
 * (الأوردرات/المنتجات/المصروفات) أو القائمة كلها (الفئات). تحديد الكل
 * بيشتغل على `items` بس فبيحافظ على أي تحديد بره النطاق المعروض.
 */
export function useRowSelection<T>(items: T[], getId: (item: T) => string | undefined) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedItems = items.filter((it) => {
    const id = getId(it);
    return id !== undefined && selected.has(id);
  });
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = items.map(getId).filter((id): id is string => id !== undefined);
      const everyIn = ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => (everyIn ? next.delete(id) : next.add(id)));
      return next;
    });
  }, [items, getId]);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, selectedItems, allSelected, toggleOne, toggleAll, clear };
}
