"use client";
import { useCallback } from "react";
import type { ConfirmOptions } from "@/components/ConfirmProvider";
import { logAction, type LogActor } from "@/lib/logger";
import type { LogAction } from "@/lib/types";

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

export interface UseCrudActionsBase {
  confirm: ConfirmFn;
  flash: (msg: string) => void;
  actor: LogActor;
  /** بيتنادى بعد نجاح أي حذف جماعي (مش مطلوب للحذف المفرد) */
  clearSelection?: () => void;
}

export interface DeleteOneConfig {
  confirmTitle: string;
  confirmMessage: string;
  successToast: string;
  errorToast: string;
  logActionName: LogAction;
  /** التفصيل المتسجل في اللوج — افتراضي "" */
  logDetail?: string;
  /**
   * فحص قبل الـ confirm — لو رجّع رسالة، بتتعرض كـ toast والعملية بتتوقف
   * من غير ما يفتح ديالوج التأكيد (مثال: فئة ليها منتجات مرتبطة بيها).
   */
  guard?: () => string | null;
  onDelete: () => Promise<void>;
}

export interface DeleteManyConfig {
  /** عدد العناصر المستهدفة — بيتسجل في اللوج */
  count: number;
  confirmTitle: string;
  confirmMessage: string;
  successToast: string;
  errorToast: string;
  logActionName: LogAction;
  /** التفصيل المتسجل في اللوج — افتراضي "" */
  logDetail?: string;
  onDeleteMany: () => Promise<void>;
}

/**
 * بيلخّص نمط الحذف المتكرر في كل صفحات الـ CRUD: تأكيد -> محاولة -> toast ->
 * تسجيل في اللوج -> (للحذف الجماعي) تفريغ التحديد. النصوص (i18n) وأسماء
 * أفعال اللوج بتتحدد لكل نداء لأنها بتختلف من صفحة لصفحة وحتى جوه الصفحة
 * نفسها (زي history اللي فيها history.delete و history.clear).
 */
export function useCrudActions({ confirm, flash, actor, clearSelection }: UseCrudActionsBase) {
  const runDelete = useCallback(
    async (cfg: DeleteOneConfig) => {
      if (cfg.guard) {
        const blocked = cfg.guard();
        if (blocked) {
          flash(blocked);
          return;
        }
      }
      if (!(await confirm({ title: cfg.confirmTitle, message: cfg.confirmMessage }))) return;
      try {
        await cfg.onDelete();
        flash(cfg.successToast);
        logAction(actor, cfg.logActionName, cfg.logDetail ?? "");
      } catch {
        flash(cfg.errorToast);
      }
    },
    [confirm, flash, actor]
  );

  const runBulkDelete = useCallback(
    async (cfg: DeleteManyConfig) => {
      if (!(await confirm({ title: cfg.confirmTitle, message: cfg.confirmMessage }))) return;
      try {
        await cfg.onDeleteMany();
        flash(cfg.successToast);
        logAction(actor, cfg.logActionName, cfg.logDetail ?? "", cfg.count);
        clearSelection?.();
      } catch {
        flash(cfg.errorToast);
      }
    },
    [confirm, flash, actor, clearSelection]
  );

  return { runDelete, runBulkDelete };
}
