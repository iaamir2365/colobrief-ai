/**
 * handout-pdf.tsx
 * Professional A4 PDF document for the SBAR Clinical Handout.
 * Uses @react-pdf/renderer for guaranteed pixel-perfect output.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format, parseISO, min, max } from "date-fns";
import type { SymptomLog } from "@/types/symptom";

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  teal: "#0d9488",
  tealLight: "#ccfbf1",
  sky: "#0284c7",
  skyLight: "#e0f2fe",
  amber: "#d97706",
  amberLight: "#fef3c7",
  violet: "#7c3aed",
  violetLight: "#ede9fe",
  rose: "#e11d48",
  roseLight: "#ffe4e6",
  emerald: "#059669",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray800: "#1f2937",
  black: "#111827",
  white: "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.black,
    backgroundColor: C.white,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    lineHeight: 1.5,
  },

  // Header
  headerBar: {
    backgroundColor: C.teal,
    borderRadius: 6,
    padding: "10 16",
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: C.white,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#a7f3d0",
    fontSize: 8,
    marginTop: 2,
  },
  headerDate: {
    color: "#a7f3d0",
    fontSize: 8,
    textAlign: "right",
  },

  // Meta row
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
    padding: "8 12",
    backgroundColor: C.gray50,
    borderRadius: 4,
    borderLeft: `3px solid ${C.teal}`,
  },
  metaItem: {
    fontSize: 8,
    color: C.gray600,
    marginRight: 16,
  },
  metaBold: {
    fontFamily: "Helvetica-Bold",
    color: C.black,
  },

  // Section
  section: {
    marginBottom: 10,
    borderRadius: 4,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: "6 10",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  sectionLetter: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  sectionBody: {
    padding: "8 10",
    fontSize: 9,
    lineHeight: 1.6,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 4,
  },
  statBox: {
    width: "13%",
    backgroundColor: C.gray100,
    borderRadius: 4,
    padding: "5 4",
    alignItems: "center",
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 6.5,
    color: C.gray600,
    textAlign: "center",
    marginTop: 2,
  },

  // Table
  tableWrapper: {
    marginTop: 10,
    borderRadius: 4,
    overflow: "hidden",
    border: `1px solid ${C.gray200}`,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.teal,
    padding: "5 4",
  },
  tableHeaderCell: {
    color: C.white,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: "4 4",
    borderBottom: `1px solid ${C.gray200}`,
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  tableCell: {
    fontSize: 7.5,
    flex: 1,
    textAlign: "center",
    color: C.gray800,
  },
  tableCellLeft: {
    textAlign: "left",
    flex: 1.5,
  },

  // Medication box
  medBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: "5 8",
    marginBottom: 4,
    border: `1px solid ${C.gray200}`,
  },
  medName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
  },
  medMeta: {
    fontSize: 7,
    color: C.gray600,
  },

  // Triggers
  triggerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  triggerBadge: {
    backgroundColor: C.tealLight,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    color: C.teal,
    fontFamily: "Helvetica-Bold",
  },

  // Divider
  divider: {
    borderBottom: `1px solid ${C.gray200}`,
    marginVertical: 10,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTop: `1px solid ${C.gray200}`,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerText: {
    fontSize: 6.5,
    color: C.gray400,
    maxWidth: "75%",
    lineHeight: 1.4,
  },
  footerPage: {
    fontSize: 7,
    color: C.gray400,
  },

  // Watermark
  watermark: {
    position: "absolute",
    top: "38%",
    left: "5%",
    fontSize: 72,
    fontFamily: "Helvetica-Bold",
    color: C.gray100,
    opacity: 0.35,
    transform: "rotate(-30deg)",
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
const BRISTOL: Record<number, string> = {
  1: "Hard lumps", 2: "Lumpy sausage", 3: "Cracked",
  4: "Smooth soft", 5: "Soft blobs", 6: "Mushy", 7: "Watery",
};

interface AISummary {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

interface HandoutPDFProps {
  symptoms: SymptomLog[];
  aiSummary?: AISummary | null;
  patientName?: string;
  attendingName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function buildStats(symptoms: SymptomLog[]) {
  if (!symptoms.length) return null;
  const sorted = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((s) => parseISO(s.date));
  const dateRange = {
    from: format(min(dates), "MMM d, yyyy"),
    to: format(max(dates), "MMM d, yyyy"),
  };
  const mid = Math.floor(sorted.length / 2);
  const painDiff = avg(sorted.slice(mid).map((s) => s.painLevel)) - avg(sorted.slice(0, mid).map((s) => s.painLevel));
  const trend = Math.abs(painDiff) < 0.5 ? "Stable" : painDiff < 0 ? "Improving" : "Worsening";

  const triggerCounts: Record<string, number> = {};
  symptoms.forEach((s) => s.triggers.forEach((t) => (triggerCounts[t] = (triggerCounts[t] || 0) + 1)));
  const topTriggers = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([t, c]) => `${t} (${c}×)`);

  const medAdherence = Math.round((symptoms.filter((s) => s.medicationTaken?.trim()).length / symptoms.length) * 100);
  const bloodDays = symptoms.filter((s) => s.bloodInStool).length;

  const medMap: Record<string, { name: string; daysTaken: number; avgPain: number }> = {};
  symptoms.forEach((s) => {
    if (!s.medicationTaken?.trim()) return;
    const name = s.medicationTaken.replace(/\d+\.?\d*\s*(mg|ml|g|mcg|tablet|capsule|puff|dose|tabs?|caps?)s?/gi, "").trim();
    if (!name) return;
    if (!medMap[name]) medMap[name] = { name, daysTaken: 0, avgPain: 0 };
    medMap[name].daysTaken++;
    medMap[name].avgPain += s.painLevel;
  });
  const medications = Object.values(medMap).map((m) => ({ ...m, avgPain: m.daysTaken > 0 ? m.avgPain / m.daysTaken : 0 })).sort((a, b) => b.daysTaken - a.daysTaken);

  return {
    dateRange, trend, topTriggers, medications,
    avgPain: avg(symptoms.map((s) => s.painLevel)),
    avgStool: avg(symptoms.map((s) => s.stoolFrequency)),
    avgStress: avg(symptoms.map((s) => s.stressLevel)),
    avgUrgency: avg(symptoms.map((s) => s.urgencyLevel)),
    medAdherence,
    bloodDays,
    bloodPct: Math.round((bloodDays / symptoms.length) * 100),
    totalLogs: symptoms.length,
    recentLogs: sorted.slice(-14),
  };
}

// ─── Section component ────────────────────────────────────────────────────────
function SectionBlock({
  letter, title, content, bg, letterColor, headerBg,
  extra,
}: {
  letter: string; title: string; content: string;
  bg: string; letterColor: string; headerBg: string;
  extra?: React.ReactNode;
}) {
  return (
    <View style={s.section} wrap={false}>
      <View style={[s.sectionHeader, { backgroundColor: headerBg }]}>
        <Text style={[s.sectionLetter, { color: letterColor }]}>{letter}</Text>
        <Text style={[s.sectionTitle, { color: letterColor }]}>{title}</Text>
      </View>
      <View style={[s.sectionBody, { backgroundColor: bg }]}>
        <Text>{content}</Text>
        {extra}
      </View>
    </View>
  );
}

// ─── Main PDF Document ────────────────────────────────────────────────────────
export function HandoutPDF({
  symptoms,
  aiSummary,
  patientName = "Not specified",
  attendingName = "Not specified",
}: HandoutPDFProps) {
  const stats = buildStats(symptoms);
  const now = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  const generated = format(new Date(), "MMM d, yyyy");

  const situation = aiSummary?.situation ?? (stats
    ? stats.avgPain <= 3
      ? `Patient reports mild abdominal symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 over ${stats.totalLogs} logged days.`
      : stats.avgPain <= 6
      ? `Patient reports moderate UC symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 and average stool frequency of ${stats.avgStool.toFixed(1)}/day over ${stats.totalLogs} logged days.`
      : `Patient reports significant UC symptoms with an average pain level of ${stats.avgPain.toFixed(1)}/10 and average stool frequency of ${stats.avgStool.toFixed(1)}/day over ${stats.totalLogs} logged days. Clinical attention recommended.`
    : "");

  const background = aiSummary?.background ?? (stats
    ? `Patient has been self-tracking UC symptoms from ${stats.dateRange.from} to ${stats.dateRange.to} (${stats.totalLogs} entries). Average stress level: ${stats.avgStress.toFixed(1)}/10.`
    : "");

  const assessment = aiSummary?.assessment ?? (stats
    ? `Overall trend: ${stats.trend}. Average pain ${stats.avgPain.toFixed(1)}/10, stool frequency ${stats.avgStool.toFixed(1)}/day, stress ${stats.avgStress.toFixed(1)}/10. Common triggers: ${stats.topTriggers.join(", ") || "None identified"}. Medication adherence: ${stats.medAdherence}%. Blood in stool: ${stats.bloodDays} days (${stats.bloodPct}%). Average urgency: ${stats.avgUrgency.toFixed(1)}/3.`
    : "");

  const recommendation = aiSummary?.recommendation ??
    "Discuss symptom trends with patient, review trigger management strategies, evaluate current medication efficacy, and consider dietary modifications based on identified triggers.";

  return (
    <Document
      title="ColoBrief AI — Clinical Handout"
      author="ColoBrief AI"
      subject="SBAR Clinical Brief for Gastroenterology"
    >
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        <Text style={s.watermark} fixed>ColoBrief AI</Text>

        {/* Header */}
        <View style={s.headerBar} fixed>
          <View>
            <Text style={s.headerTitle}>ColoBrief AI — Clinical Handout</Text>
            <Text style={s.headerSubtitle}>SBAR Brief for Gastroenterology Consultation</Text>
          </View>
          <View>
            <Text style={s.headerDate}>{now}</Text>
          </View>
        </View>

        {/* Patient Meta */}
        <View style={s.metaRow}>
          <Text style={s.metaItem}><Text style={s.metaBold}>Patient: </Text>{patientName}</Text>
          {stats && (
            <Text style={s.metaItem}>
              <Text style={s.metaBold}>Period: </Text>{stats.dateRange.from} – {stats.dateRange.to}
            </Text>
          )}
          <Text style={s.metaItem}><Text style={s.metaBold}>Attending: </Text>{attendingName}</Text>
          <Text style={s.metaItem}><Text style={s.metaBold}>Generated: </Text>{generated}</Text>
          {stats && (
            <Text style={s.metaItem}><Text style={s.metaBold}>Total Logs: </Text>{stats.totalLogs} days</Text>
          )}
        </View>

        {/* S — Situation */}
        <SectionBlock
          letter="S" title="— Situation"
          content={situation}
          headerBg="#ccfbf1" letterColor={C.teal} bg="#f0fdfa"
        />

        {/* B — Background */}
        <SectionBlock
          letter="B" title="— Background"
          content={background}
          headerBg="#e0f2fe" letterColor={C.sky} bg="#f0f9ff"
        />

        {/* A — Assessment */}
        {stats && (
          <View style={s.section} wrap={false}>
            <View style={[s.sectionHeader, { backgroundColor: "#fef3c7" }]}>
              <Text style={[s.sectionLetter, { color: C.amber }]}>A</Text>
              <Text style={[s.sectionTitle, { color: C.amber }]}>— Assessment</Text>
            </View>
            <View style={[s.sectionBody, { backgroundColor: "#fffbeb" }]}>
              <Text>{assessment}</Text>

              {/* Stats grid */}
              <View style={s.statsGrid}>
                {[
                  { label: "Avg Pain", value: `${stats.avgPain.toFixed(1)}/10` },
                  { label: "Avg Frequency", value: `${stats.avgStool.toFixed(1)}/day` },
                  { label: "Avg Stress", value: `${stats.avgStress.toFixed(1)}/10` },
                  { label: "Trend", value: stats.trend },
                  { label: "Med Adherence", value: `${stats.medAdherence}%` },
                  { label: "Blood Days", value: `${stats.bloodDays} (${stats.bloodPct}%)` },
                  { label: "Avg Urgency", value: `${stats.avgUrgency.toFixed(1)}/3` },
                ].map((stat) => (
                  <View key={stat.label} style={s.statBox}>
                    <Text style={s.statValue}>{stat.value}</Text>
                    <Text style={s.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Top Triggers */}
              {stats.topTriggers.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4, color: C.amber }}>
                    Top Triggers:
                  </Text>
                  <View style={s.triggerRow}>
                    {stats.topTriggers.map((t) => (
                      <Text key={t} style={s.triggerBadge}>{t}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* R — Recommendation */}
        <SectionBlock
          letter="R" title="— Recommendation"
          content={recommendation}
          headerBg="#ede9fe" letterColor={C.violet} bg="#faf5ff"
        />

        {/* Medication Summary */}
        {stats && stats.medications.length > 0 && (
          <View style={{ marginBottom: 10 }} wrap={false}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.teal, marginBottom: 5 }}>
              💊 Medication Adherence — {stats.medAdherence}% ({symptoms.filter((s) => s.medicationTaken?.trim()).length} of {stats.totalLogs} days)
            </Text>
            {stats.medications.map((med) => (
              <View key={med.name} style={s.medBox}>
                <Text style={s.medName}>{med.name}</Text>
                <Text style={s.medMeta}>{med.daysTaken} days taken · Avg Pain: {med.avgPain.toFixed(1)}/10</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.divider} />

        {/* Recent Symptom Log Table */}
        {stats && stats.recentLogs.length > 0 && (
          <View>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 6 }}>
              Recent Symptom Log (last {stats.recentLogs.length} entries)
            </Text>
            <View style={s.tableWrapper}>
              <View style={s.tableHeader}>
                {["Date", "Pain", "Frequency", "Stool Type", "Stress", "Blood", "Urgency", "Triggers"].map((h) => (
                  <Text key={h} style={s.tableHeaderCell}>{h}</Text>
                ))}
              </View>
              {stats.recentLogs.map((log, i) => (
                <View key={log.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, s.tableCellLeft]}>{format(parseISO(log.date), "MMM d")}</Text>
                  <Text style={s.tableCell}>{log.painLevel}/10</Text>
                  <Text style={s.tableCell}>{log.stoolFrequency}×</Text>
                  <Text style={s.tableCell}>Type {log.stoolType} – {BRISTOL[Math.round(log.stoolType)] ?? ""}</Text>
                  <Text style={s.tableCell}>{log.stressLevel}/10</Text>
                  <Text style={[s.tableCell, { color: log.bloodInStool ? C.rose : C.gray600 }]}>
                    {log.bloodInStool ? "Yes" : "No"}
                  </Text>
                  <Text style={s.tableCell}>{["None", "Mild", "Moderate", "Severe"][log.urgencyLevel] ?? "None"}</Text>
                  <Text style={s.tableCell}>{log.triggers.slice(0, 2).join(", ") || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generated by ColoBrief AI — An empathetic, AI-assisted symptom tracking portal for Ulcerative Colitis patients.
            This document is a supplementary tool for clinical consultations and does not replace professional medical advice.
          </Text>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
