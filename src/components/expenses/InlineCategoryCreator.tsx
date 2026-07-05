"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { ExpenseCategory } from "@/lib/types";

interface InlineCategoryCreatorProps {
  categories: ExpenseCategory[];
  category: string;
  onCategoryChange: (name: string) => void;
  /** إنشاء فئة جديدة من جوه المودال على طول */
  onCreateCategory: (name: string) => Promise<void>;
  /** تعطيل الحقل لو الفورم الرئيسي مشغول */
  disabled?: boolean;
}

/** حقل اختيار الفئة + إمكانية إضافة فئة جديدة inline من غير ما نسيب المودال */
export default function InlineCategoryCreator({
  categories, category, onCategoryChange, onCreateCategory, disabled,
}: InlineCategoryCreatorProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState("");
  const newCatRef = useRef<HTMLInputElement>(null);

  // الفئات النشطة فقط في القائمة، بس لو الأوردر على فئة متعطلة نسيبها ظاهرة
  const options = categories.filter((c) => c.active || c.name === category);

  function openAddCat() {
    setCatErr("");
    setNewCat("");
    setAddingCat(true);
    // نركّز على الحقل بعد ما يظهر
    requestAnimationFrame(() => newCatRef.current?.focus());
  }

  function cancelAddCat() {
    setAddingCat(false);
    setNewCat("");
    setCatErr("");
  }

  async function confirmAddCat() {
    const name = newCat.trim();
    if (!name) return;
    // لو الفئة موجودة بالفعل نختارها بدل ما نكرّرها
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onCategoryChange(existing.name);
      cancelAddCat();
      return;
    }
    setCatBusy(true);
    setCatErr("");
    try {
      await onCreateCategory(name);
      onCategoryChange(name); // هتظهر في القائمة أول ما الـ snapshot يوصل
      setAddingCat(false);
      setNewCat("");
    } catch {
      setCatErr(t("toast.catSaveErr"));
    } finally {
      setCatBusy(false);
    }
  }

  function onNewCatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // ما نسيبش الفورم الرئيسي يتبعت
      confirmAddCat();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelAddCat();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="form-label">{t("category")} <span className="req">*</span></label>
        {!addingCat && (
          <button
            type="button"
            className="mt-3 mb-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-deep transition-colors disabled:opacity-50"
            onClick={openAddCat}
            disabled={disabled}
            title={t("addCategoryTitle")}
          >
            <span className="icon !text-[16px] leading-none" aria-hidden>add</span>
            {t("addCategoryBtn")}
          </button>
        )}
      </div>
      {addingCat ? (
        <div className="fade-up">
          <div className="flex items-stretch gap-1.5">
            <input
              ref={newCatRef}
              className="form-input flex-1"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={onNewCatKeyDown}
              placeholder={t("newCategoryPh")}
              dir="auto"
              disabled={catBusy}
            />
            <button
              type="button"
              className="btn-primary !px-3"
              onClick={confirmAddCat}
              disabled={catBusy || !newCat.trim()}
              aria-label={t("addCategoryTitle")}
              title={t("addCategoryTitle")}
            >
              <span className="icon !text-[18px]" aria-hidden>check</span>
            </button>
            <button
              type="button"
              className="btn-ghost !px-3"
              onClick={cancelAddCat}
              disabled={catBusy}
              aria-label={tCommon("cancel")}
              title={tCommon("cancel")}
            >
              <span className="icon !text-[18px]" aria-hidden>close</span>
            </button>
          </div>
          {catErr && <div className="text-danger text-[12px] mt-1">{catErr}</div>}
        </div>
      ) : (
        <select
          className="form-input"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          required
        >
          <option value="">{t("categoryPick")}</option>
          {options.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}
