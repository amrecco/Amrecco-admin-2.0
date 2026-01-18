"use client";

import React, { useMemo, useState } from "react";
import styles from "./kanban.module.css";
import CandidateCard from "./CandidateCard";
import ShareProfileModal from "@/src/components/email/Sharedprofile";
import type { Candidate, KanbanStage } from "@/src/types/kanban.types";

type Props = {
  stage: KanbanStage;
  candidates: Candidate[];
  onDropStage: (stage: KanbanStage) => void;
  onDragStart: (candidateId: string) => void;
  draggingId: string | null;
};

export default function KanbanRow({
  stage,
  candidates,
  onDropStage,
  onDragStart,
  draggingId,
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selectedIds.includes(c.id)),
    [candidates, selectedIds]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds([]);
  }

  function openBulkShare() {
    if (selectedIds.length === 0) return;
    setBulkOpen(true);
  }

  // ✅ FIX: Clear selections when candidates change (e.g., after filtering)
  React.useEffect(() => {
    const validIds = candidates.map(c => c.id);
    setSelectedIds(prev => prev.filter(id => validIds.includes(id)));
  }, [candidates]);

  // ✅ FIX: Prevent drop in bulk mode
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    
    if (!bulkMode) {
      onDropStage(stage);
    }
  }

  // ✅ FIX: Only allow drag over when not in bulk mode
  function handleDragOver(e: React.DragEvent) {
    if (bulkMode) return;
    
    e.preventDefault();
    setIsOver(true);
  }

  return (
    <div
      className={`${styles.row} ${isOver ? styles.rowOver : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <div
        className={`${styles.rowHeader} ${
          stage === "Initial Screening"
            ? styles.rowInitial
            : stage === "Interviewed"
            ? styles.rowInterviewed
            : stage === "Profile Shared"
            ? styles.rowProfile
            : styles.rowFinal
        }`}
      >
        <div className={styles.rowTitle}>{stage}</div>
        <div className={styles.rowCount}>{candidates.length}</div>

        <div className={styles.bulkHeaderActions}>
          {!bulkMode ? (
            <button
              type="button"
              className={styles.rowPrimaryBtn}
              disabled={candidates.length === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBulkMode(true);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 700,
              }}
            >
              Share Bulk
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.rowPrimaryBtn}
                disabled={selectedIds.length === 0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openBulkShare();
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                Share Selected ({selectedIds.length})
              </button>

              <button
                type="button"
                className={styles.rowMiniBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  exitBulkMode();
                }}
                style={{
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.rowBody}>
        {candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            onDragStart={onDragStart}
            dragging={draggingId === c.id}
            bulkMode={bulkMode}
            selected={selectedIds.includes(c.id)}
            onToggleSelect={toggleSelect}
          />
        ))}

        {candidates.length === 0 && (
          <div className={styles.emptyRowHint}>Drop candidates here</div>
        )}
      </div>

      <ShareProfileModal
        open={bulkOpen}
        onClose={() => {
          setBulkOpen(false);
          // ✅ FIX: Optionally exit bulk mode after sharing
          // exitBulkMode();
        }}
        candidates={selectedCandidates}
      />
    </div>
  );
}