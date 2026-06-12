"use client";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}

/** مفتاح تبديل (switch) — أخضر = مفعّل */
export default function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className={
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-standard " +
        "disabled:opacity-40 disabled:cursor-not-allowed " +
        (checked ? "bg-success" : "bg-ink-300")
      }
    >
      <span
        aria-hidden
        className={
          "inline-block h-4 w-4 rounded-full bg-canvas shadow-sm transform transition-transform duration-200 ease-standard " +
          (checked ? "ltr:translate-x-[18px] rtl:-translate-x-[18px]" : "ltr:translate-x-0.5 rtl:-translate-x-0.5")
        }
      />
    </button>
  );
}
