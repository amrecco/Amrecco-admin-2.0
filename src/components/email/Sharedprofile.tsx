"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./shareProfileModal.module.css";
import type { Candidate } from "@/src/types/kanban.types";
import Toast from "@/src/contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
};

type LinkItem = {
  candidateId: string;
  name: string;
  url?: string;
  error?: string;
};

type TabOption = {
  id: string;
  label: string;
};

function buildMultiEmailDraft(args: { candidates: LinkItem[] }) {
  const valid = args.candidates.filter((c) => c.url);
  const subject =
    valid.length === 1
      ? `Candidate Profile: ${valid[0].name}`
      : `Candidate Profiles (${valid.length})`;

  const list = valid
    .map((c, i) => `${i + 1}) ${c.name}\n${c.url}`)
    .join("\n\n");

  const body = `Hi,

Sharing candidate profiles for your review:

${list}

Let me know if you'd like additional notes or an interview summary.

Thanks,
Amrecco Recruiting`;

  return { subject, body };
}

export default function ShareProfilesModal({ open, onClose, candidates }: Props) {
  const [mounted, setMounted] = useState(false);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [loadingLinks, setLoadingLinks] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [sending, setSending] = useState(false);

  // ✅ Tab selection state
  const availableTabs: TabOption[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    {id: 'summary', label: 'summary' },
    { id: 'video', label: 'Video' },
    { id: 'availability', label: 'Availability' },
  ];
  
  const [selectedTabs, setSelectedTabs] = useState<string[]>(['overview', 'experience','summary', 'video', 'availability']);

  // ✅ Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("success");

  useEffect(() => setMounted(true), []);

  // ✅ FIX: Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTo("");
      setSubject("");
      setBody("");
      setLinks([]);
      setSending(false);
    }
  }, [open]);

  // Generate share links when opening
  useEffect(() => {
    if (!open || candidates.length === 0) return;

    let cancelled = false;

    (async () => {
      setLoadingLinks(true);
      setLinks([]);

      // Show placeholders while loading
      const initial: LinkItem[] = candidates.map((c) => ({
        candidateId: c.id,
        name: c.fullName || "Candidate",
      }));
      setLinks(initial);

      try {
        const results = await Promise.allSettled(
          candidates.map(async (c) => {
            const res = await fetch("/api/profile-link/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recordId: c.id,
                expiresInDays: 7,
                visibleTabs: selectedTabs,
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Failed to generate link");

            return {
              candidateId: c.id,
              name: c.fullName || "Candidate",
              url: data.url as string,
            } as LinkItem;
          })
        );

        if (cancelled) return;

        const next: LinkItem[] = results.map((r, idx) => {
          const base = {
            candidateId: candidates[idx].id,
            name: candidates[idx].fullName || "Candidate",
          };

          if (r.status === "fulfilled") return r.value;
          return { ...base, error: r.reason?.message ?? "Link failed" };
        });

        setLinks(next);

        const draft = buildMultiEmailDraft({ candidates: next });
        setSubject(draft.subject);
        setBody(draft.body);

        const failedCount = next.filter((x) => x.error).length;
        if (failedCount > 0) {
          setToastVariant("info");
          setToastMsg(
            `${failedCount} link(s) failed to generate. You can still send with the successful ones.`
          );
          setToastOpen(true);
        }
      } catch (e: any) {
        if (cancelled) return;
        
        setToastVariant("error");
        setToastMsg(e?.message ?? "Could not generate share links");
        setToastOpen(true);
      } finally {
        if (!cancelled) setLoadingLinks(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, candidates, selectedTabs]);

  const validCount = useMemo(() => links.filter((l) => l.url).length, [links]);

  const canSend = useMemo(() => {
        return !!to.trim() && !!subject.trim() && !!body.trim() && !sending && validCount > 0 && selectedTabs.length > 0;
  }, [to, subject, body, sending, validCount, selectedTabs]);

  function toggleTab(tabId: string) {
    setSelectedTabs(prev => {
      if (prev.includes(tabId)) {
        // Don't allow removing all tabs
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== tabId);
      }
      return [...prev, tabId];
    });
  }

  function selectAllTabs() {
    setSelectedTabs(availableTabs.map(t => t.id));
  }

  function deselectAllTabs() {
    // Keep at least one tab selected
    setSelectedTabs(['overview']);
  }

  async function copyAllLinks() {
    const validLinks = links.filter((l) => l.url);
    
    if (validLinks.length === 0) {
      setToastVariant("info");
      setToastMsg("No valid links to copy.");
      setToastOpen(true);
      return;
    }

    const txt = validLinks
      .map((l) => l.url)
      .join("\n");

    try {
      await navigator.clipboard.writeText(txt);
      setToastVariant("success");
      setToastMsg(`Copied ${validLinks.length} link(s) to clipboard.`);
      setToastOpen(true);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = txt;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand("copy");
        setToastVariant("success");
        setToastMsg(`Copied ${validLinks.length} link(s) to clipboard.`);
        setToastOpen(true);
      } catch {
        window.prompt("Copy links:", txt);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  async function copyEmail() {
    const txt = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    
    try {
      await navigator.clipboard.writeText(txt);
      setToastVariant("success");
      setToastMsg("Email copied to clipboard.");
      setToastOpen(true);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = txt;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand("copy");
        setToastVariant("success");
        setToastMsg("Email copied to clipboard.");
        setToastOpen(true);
      } catch {
        window.prompt("Copy email:", txt);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  async function sendEmail() {
    if (!canSend) return;

    setSending(true);
    
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          text: body,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send email");

      setToastVariant("success");
      setToastMsg("Email sent successfully!");
      setToastOpen(true);

      // ✅ FIX: Close modal after successful send (with slight delay for toast)
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (e: any) {
      setToastVariant("error");
      setToastMsg(e?.message ?? "Failed to send email.");
      setToastOpen(true);
    } finally {
      setSending(false);
    }
  }

  // ✅ FIX: Close on Escape key
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // ✅ FIX: Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div 
        className={styles.backdrop} 
        onMouseDown={(e) => {
          // Only close if clicking the backdrop itself
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className={styles.modal} 
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.title}>Share Candidate Profiles</div>
            <button 
              className={styles.closeBtn} 
              type="button" 
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className={styles.subTitle}>
            Selected: <b>{candidates.length}</b> • Ready links: <b>{validCount}</b>
          </div>

          {/* Tab Selection Section */}
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className={styles.label}>Visible Tabs</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={selectAllTabs}
                  style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                >
                  Select All
                </button>
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={deselectAllTabs}
                  style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
              padding: 16,
              backgroundColor: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              {availableTabs.map(tab => (
  <label
    key={tab.id}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      padding: '8px 12px',
      backgroundColor: selectedTabs.includes(tab.id) ? '#e7f5ff' : 'white',
      border: selectedTabs.includes(tab.id) ? '2px solid #339af0' : '1px solid #dee2e6',
      borderRadius: 6,
      transition: 'all 0.2s',
      fontWeight: selectedTabs.includes(tab.id) ? 600 : 400,
    }}
  >
    <input
      type="checkbox"
      checked={selectedTabs.includes(tab.id)}
      onChange={() => toggleTab(tab.id)}
      style={{ cursor: 'pointer' }}
    />
    <span>{tab.label}</span>  {/* This should show "summary" */}
  </label>
))}
            </div>
            
            {selectedTabs.length === 0 && (
              <div style={{ 
                marginTop: 8, 
                padding: '8px 12px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: 6,
                fontSize: '0.875rem',
                color: '#856404'
              }}>
                ⚠️ At least one tab must be selected
              </div>
            )}
            
            <div style={{ 
              marginTop: 8, 
              fontSize: '0.875rem', 
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              Selected tabs will be visible to recipients • Interview Summary is always hidden from shared profiles
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Share Links</label>

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={copyAllLinks}
                disabled={loadingLinks || validCount === 0}
              >
                {loadingLinks ? "Generating..." : `Copy All Links (${validCount})`}
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, maxHeight: "200px", overflowY: "auto" }}>
              {links.map((l) => (
                <div key={l.candidateId} className={styles.row}>
                  <input
                    className={styles.input}
                    value={
                      loadingLinks
                        ? `Generating link...`
                        : l.url
                        ? l.url
                        : l.error || "Failed to generate link"
                    }
                    readOnly
                    style={{
                      color: l.error ? "#dc2626" : undefined,
                      fontStyle: l.error ? "italic" : undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label} htmlFor="email-to">
              To
            </label>
            <input
              id="email-to"
              className={styles.input}
              type="email"
              placeholder="hiring.manager@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={loadingLinks}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label} htmlFor="email-subject">
              Subject
            </label>
            <input
              id="email-subject"
              className={styles.input}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loadingLinks}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label} htmlFor="email-body">
              Email Body (editable)
            </label>
            <textarea
              id="email-body"
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              disabled={loadingLinks}
            />
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.secondaryBtn} 
              type="button" 
              onClick={copyEmail}
              disabled={!to.trim() || !subject.trim() || !body.trim()}
            >
              Copy Email
            </button>

            <button
              className={styles.primaryBtn}
              type="button"
              onClick={sendEmail}
              disabled={!canSend}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      </div>

      <Toast
        open={toastOpen}
        message={toastMsg}
        variant={toastVariant}
        onClose={() => setToastOpen(false)}
      />
    </>,
    document.body
  );
}