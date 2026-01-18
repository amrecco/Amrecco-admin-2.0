"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./kanban.module.css";
import type { Candidate } from "@/src/types/kanban.types";
import ShareProfileModal from "@/src/components/email/Sharedprofile";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "C";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "A";
  return (a + b).toUpperCase();
}

export default function CandidateCard({
  candidate,
  onDragStart,
  dragging,
  bulkMode = false,
  selected = false,
  onToggleSelect,
}: {
  candidate: Candidate;
  onDragStart: (candidateId: string) => void;
  dragging: boolean;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (candidateId: string) => void;
}) {
  const router = useRouter();
  const hide = !!candidate.hidePersonalInfo;

  const [shareOpen, setShareOpen] = useState(false);

  const email = hide ? "Hidden" : candidate.email || "—";
  const phone = hide
    ? "Hidden"
    : candidate.phone?.trim()
    ? candidate.phone
    : "No phone provided";

  const profileUrl = `/candidate/${candidate.id}`;

  function handleViewProfile(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    router.push(profileUrl);
  }

  function handleShareProfile(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  }

  // ✅ FIX: Prevent drag when in bulk mode
  function handleDragStart(e: React.DragEvent) {
    if (bulkMode) {
      e.preventDefault();
      return;
    }
    onDragStart(candidate.id);
  }

  // ✅ FIX: Handle checkbox toggle properly
  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    onToggleSelect?.(candidate.id);
  }

  // ✅ FIX: Apply selected border style
  const cardClasses = `${styles.profileCard} ${dragging ? styles.dragging : ""} ${selected ? styles.selected : ""}`;

  return (
    <>
      <div
        className={cardClasses}
        draggable={!bulkMode}
        onDragStart={handleDragStart}
        style={{
          cursor: bulkMode ? "pointer" : dragging ? "grabbing" : "grab",
          border: selected ? "2px solid #3b82f6" : undefined,
          boxShadow: selected ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : undefined,
        }}
      >
        <div className={styles.profileHeader}>
          {/* ✅ FIX: Checkbox positioned before avatar */}
          {bulkMode && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select candidate for bulk share"
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          )}

          <div className={styles.avatarCircle}>{initials(candidate.fullName)}</div>

          <div className={styles.profileMeta}>
            <div className={styles.profileNameRow}>
              <div className={styles.profileName}>{candidate.fullName || "—"}</div>
              <span className={styles.activePill}>{candidate.status || "Active"}</span>
            </div>
            <div className={styles.profileEmail}>{email}</div>
          </div>
        </div>

        <div className={styles.profileBody}>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>📞</span>
            <span>{phone}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>📍</span>
            <span>{candidate.location || "—"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🏢</span>
            <span>
              {candidate.industry || "Industry not specified"}
            </span>
          </div>

          {candidate.annualRevenue ? (
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}>💰</span>
              <span>
                ${Number(candidate.annualRevenue).toLocaleString()} revenue
              </span>
            </div>
          ) : (
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}>💰</span>
              <span>Revenue not specified</span>
            </div>
          )}

          {!hide && candidate.linkedin ? (
            <a
              className={styles.linkedinLink}
              href={candidate.linkedin}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn Profile
            </a>
          ) : (
            <div className={styles.linkedinDisabled}>LinkedIn Profile</div>
          )}
        </div>

        <div className={styles.profileActions}>
          <button
            className={styles.navyActionBtn}
            type="button"
            onClick={handleViewProfile}
          >
            View Profile
          </button>

          <button
            className={styles.greenActionBtn}
            type="button"
            onClick={handleShareProfile}
          >
            Share Profile
          </button>
        </div>
      </div>

      <ShareProfileModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        candidates={[candidate]}
      />
    </>
  );
}