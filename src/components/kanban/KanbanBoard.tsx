"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./kanban.module.css";
import KanbanRow from "./KanbanRow";
import type { Candidate, KanbanStage } from "@/src/types/kanban.types";

const STAGES: KanbanStage[] = [
  "Initial Screening",
  "Interviewed",
  "Profile Shared",
  "Final Decision",
];

const STATUS_OPTIONS = ["All Statuses", "Active", "Inactive", "On Hold"];
const INDUSTRY_OPTIONS = [
  "All Industries",
  "Freight Forwarding",
  "Trucking",
  "3PL",
  "Saas Logistics"
];

function safeArray(input: any): Candidate[] {
  if (Array.isArray(input?.candidates)) return input.candidates;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input)) return input;
  return [];
}

export default function KanbanBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [industryFilter, setIndustryFilter] = useState<string>("All Industries");

  async function load() {
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/kanban", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed (${res.status})`);
      }

      const json = await res.json();
      setCandidates(safeArray(json));
    } catch (e: any) {
      setCandidates([]);
      setErrorMsg(e?.message || "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ FIX: Search should also check fullName
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        candidate.fullName?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.location?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        String(candidate.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesIndustry =
        industryFilter === "All Industries" ||
        candidate.industry === industryFilter;

      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [candidates, searchQuery, statusFilter, industryFilter]);

  // ✅ FIX: Ensure stage is valid, default to Initial Screening
  const byStage = useMemo(() => {
    const map: Record<KanbanStage, Candidate[]> = {
      "Initial Screening": [],
      Interviewed: [],
      "Profile Shared": [],
      "Final Decision": [],
    };

    for (const c of filteredCandidates) {
      const safeStage = STAGES.includes(c.stage as KanbanStage)
        ? (c.stage as KanbanStage)
        : "Initial Screening";

      map[safeStage].push({ ...c, stage: safeStage });
    }

    return map;
  }, [filteredCandidates]);

  // Stats calculations
  const total = filteredCandidates.length;
  const activeCount = filteredCandidates.filter(
    (c) => String(c.status || "").toLowerCase() === "active"
  ).length;
  const underReviewCount = filteredCandidates.filter(
    (c) => c.stage === "Profile Shared"
  ).length;
  const hiredCount = filteredCandidates.filter(
    (c) => c.stage === "Final Decision"
  ).length;

  function handleDragStart(candidateId: string) {
    setDraggingId(candidateId);
  }

  async function handleDrop(targetStage: KanbanStage) {
    if (!draggingId) return;

    const movedId = draggingId;
    setDraggingId(null);

    // ✅ FIX: Find the candidate being moved
    const movingCandidate = candidates.find(c => c.id === movedId);
    if (!movingCandidate) return;

    // ✅ FIX: Don't update if already in target stage
    if (movingCandidate.stage === targetStage) return;

    // Keep snapshot for rollback
    const prevCandidates = candidates;

    // Optimistic UI update
    setCandidates((prevState) =>
      prevState.map((c) =>
        c.id === movedId ? { ...c, stage: targetStage } : c
      )
    );

    try {
      const res = await fetch("/api/kanban/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: movedId, stage: targetStage }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to update stage");
      }

      // ✅ FIX: Optionally parse response and update with server data
      // const updated = await res.json();
      // setCandidates(prev => prev.map(c => c.id === movedId ? updated : c));

    } catch (err: any) {
      // Rollback on failure
      setCandidates(prevCandidates);
      console.error("Stage update failed:", err);
      alert(err?.message || "Stage update failed. Please try again.");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All Statuses");
    setIndustryFilter("All Industries");
  }

  return (
    <div className={styles.pageShell}>
      <div className={styles.wrapper}>
        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <div className={styles.filterIconBox}>🔍</div>
            <h2 className={styles.filterTitle}>Search & Filter Candidates</h2>
          </div>

          <div className={styles.filterGrid}>
            {/* Search Input */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="search-input">
                Search Candidates
              </label>
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by name, email, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="status-filter">
                Status Filter
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry Filter */}
            <div className={styles.filterField}>
              <label className={styles.filterLabel} htmlFor="industry-filter">
                Industry Filter
              </label>
              <select
                id="industry-filter"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {INDUSTRY_OPTIONS.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className={styles.clearFiltersBtn}
            type="button"
          >
            Clear All Filters
          </button>
        </div>

        {/* Header row */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Candidate Management</h1>
            <p className={styles.pageSub}>
              {loading
                ? "Loading candidates from Airtable…"
                : `${filteredCandidates.length} of ${candidates.length} candidates found`}
            </p>

            {errorMsg ? (
              <p className={styles.errorText}>
                {errorMsg}{" "}
                <button className={styles.linkBtn} onClick={load} type="button">
                  Refresh
                </button>
              </p>
            ) : null}
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statNavy}`}>
            <div className={styles.statTop}>
              <div className={styles.iconBox}>👥</div>
              <span className={styles.badge}>Live</span>
            </div>
            <div className={styles.statValue}>{total}</div>
            <div className={styles.statLabel}>Total Candidates</div>
          </div>

          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statTop}>
              <div className={styles.iconBox}>✅</div>
              <span className={styles.badge}>Status</span>
            </div>
            <div className={styles.statValue}>{activeCount}</div>
            <div className={styles.statLabel}>Active Candidates</div>
          </div>

          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statTop}>
              <div className={styles.iconBox}>👁️</div>
              <span className={styles.badge}>Queue</span>
            </div>
            <div className={styles.statValue}>{underReviewCount}</div>
            <div className={styles.statLabel}>Under Review</div>
          </div>

          <div className={`${styles.statCard} ${styles.statPurple}`}>
            <div className={styles.statTop}>
              <div className={styles.iconBox}>🎯</div>
              <span className={styles.badge}>Outcome</span>
            </div>
            <div className={styles.statValue}>{hiredCount}</div>
            <div className={styles.statLabel}>Successful Hires</div>
          </div>
        </div>

        {/* Kanban rows */}
        <div className={styles.kanbanRows}>
          {STAGES.map((stage) => (
            <KanbanRow
              key={stage}
              stage={stage}
              candidates={byStage[stage]}
              onDropStage={handleDrop}
              onDragStart={handleDragStart}
              draggingId={draggingId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}