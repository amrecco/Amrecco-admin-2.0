"use client";

import React, { useState } from "react";

export default function EditableField({
  value,
  onSave,
  multiline = false,
}: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        style={{ cursor: "pointer" }}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {value?.trim() ? value : <span style={{ opacity: 0.5 }}>Click to add</span>}
      </div>
    );
  }

  return (
    <div>
      {multiline ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: "100%", minHeight: 120 }}
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: "100%" }}
        />
      )}

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  );
}
