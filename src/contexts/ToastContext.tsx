"use client";

import React, { useEffect } from "react";
import styles from "./toast.module.css";

type ToastProps = {
  open: boolean;
  message: string;
  variant?: "success" | "error" | "info";
  onClose: () => void;
  durationMs?: number;
};

export default function Toast({
  open,
  message,
  variant = "success",
  onClose,
  durationMs = 2600,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  return (
    <div className={`${styles.toast} ${styles[variant]}`} role="status" aria-live="polite">
      <div className={styles.icon}>
        {variant === "success" ? "✓" : variant === "error" ? "!" : "i"}
      </div>
      <div className={styles.text}>{message}</div>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
}
