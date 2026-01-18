import { Suspense } from "react";
import KanbanBoard from "@/src/components/kanban/KanbanBoard";

function KanbanLoader() {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        {/* Header skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="kbPulse" style={{ height: 18, width: 220, borderRadius: 10 }} />
            <div className="kbPulse" style={{ height: 12, width: 320, borderRadius: 10, opacity: 0.8 }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="kbPulse" style={{ height: 38, width: 120, borderRadius: 12 }} />
            <div className="kbPulse" style={{ height: 38, width: 140, borderRadius: 12 }} />
          </div>
        </div>

        {/* Columns */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {[0, 1, 2, 3].map((col) => (
            <div
              key={col}
              style={{
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.7)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 14, display: "flex", justifyContent: "space-between" }}>
                <div className="kbPulse" style={{ height: 14, width: 140, borderRadius: 10 }} />
                <div className="kbPulse" style={{ height: 20, width: 32, borderRadius: 999 }} />
              </div>

              <div style={{ padding: 14, display: "grid", gap: 12 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.9)",
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="kbPulse" style={{ height: 44, width: 44, borderRadius: 999 }} />
                      <div style={{ flex: 1, display: "grid", gap: 8 }}>
                        <div className="kbPulse" style={{ height: 12, width: "70%", borderRadius: 10 }} />
                        <div className="kbPulse" style={{ height: 10, width: "55%", borderRadius: 10, opacity: 0.8 }} />
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      <div className="kbPulse" style={{ height: 10, width: "88%", borderRadius: 10, opacity: 0.75 }} />
                      <div className="kbPulse" style={{ height: 10, width: "76%", borderRadius: 10, opacity: 0.65 }} />
                      <div className="kbPulse" style={{ height: 10, width: "62%", borderRadius: 10, opacity: 0.6 }} />
                    </div>

                    <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      <div className="kbPulse" style={{ height: 34, width: "50%", borderRadius: 12 }} />
                      <div className="kbPulse" style={{ height: 34, width: "50%", borderRadius: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .kbPulse {
            background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06));
            background-size: 200% 100%;
            animation: kbShimmer 1.2s ease-in-out infinite;
          }
          @keyframes kbShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <div style={{ padding: "24px 0" }}>
      <Suspense fallback={<KanbanLoader />}>
        <KanbanBoard />
      </Suspense>
    </div>
  );
}
