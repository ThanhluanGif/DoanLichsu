import type { ReactNode } from "react";

type ExternalGate = { id: string; status: string; owner: string | null; requiredOwnerRole: string; requiredEvidence: string; nextAction: string };
type Dashboard = {
  releaseStatus: string;
  coverage: { mandatory: unknown };
  rights: { status: string; servedBinary: number; linkOnly: number };
  ai: { status: string; targetQuestions: number; actualQuestions: number; targetGap: number; citationPrecision?: number; injectionLeakRate?: number; publicBeta: boolean };
  privacy: { status: string; publicAi: string };
  corrections: { lastIntake: string; slaHours: number | null; reporterPublic: boolean };
  contentHistory?: { status: string; publishedContent: number; candidateCount: number; databaseWrites: number; fabricatedApproval: boolean; councilApproval: string };
  operations: { readiness: string; fixedProductionDomain: boolean; backupRestoreVerified?: boolean; backupRestore?: string; uptimeObservation?: string; performanceObservation?: string; securityLocal?: string; independentSecurity?: string };
  wikimedia?: { metadataRecords: number; rightsStatus: string; reviewStatus: string; binaryDownloaded: boolean };
  aiComparison?: { status: string; configs: string[]; modelIndependence: string; humanApproval: string };
  externalGates: ExternalGate[];
  blockers: string[];
  disclosure: string;
};

const gateLabels: Record<string, { vi: string; en: string; evidenceVi: string; evidenceEn: string }> = {
  "official-production": { vi: "Triển khai production chính thức", en: "Official production deployment", evidenceVi: "Tên miền HTTPS cố định, bản ghi triển khai và bằng chứng health, OpenAPI, search.", evidenceEn: "A fixed HTTPS origin, deployment record, and health, OpenAPI, and search evidence." },
  "uptime-90-day": { vi: "Theo dõi uptime 90 ngày", en: "90-day uptime observation", evidenceVi: "Bản xuất dữ liệu từ hệ thống giám sát trong 90 ngày kèm nhật ký sự cố.", evidenceEn: "An external monitoring export covering 90 days with incident review." },
  "council-signoff": { vi: "Hội đồng sử học ký biên bản", en: "Historian Council sign-off", evidenceVi: "Biên bản ký về chương trình, chính sách, quyền tư liệu và release.", evidenceEn: "Signed minutes covering curriculum, policy, rights, and release." },
  "ai-golden-human-approval": { vi: "Duyệt bộ câu hỏi AI bởi người thật", en: "Human approval of the AI golden set", evidenceVi: "Sổ duyệt hai người cho toàn bộ bộ đánh giá đã đóng băng.", evidenceEn: "A dual-human review ledger for the complete frozen evaluation set." },
  "model-comparison": { vi: "So sánh model độc lập", en: "Independent model comparison", evidenceVi: "Báo cáo so sánh model/cấu hình trên cùng một bộ đánh giá.", evidenceEn: "An independent model/configuration comparison on the same evaluation set." },
  "dpia-approval": { vi: "Phê duyệt DPIA và quyền riêng tư", en: "DPIA and privacy approval", evidenceVi: "DPIA được phê duyệt, có kiểm soát lưu trữ, xóa, người giám hộ và sự cố.", evidenceEn: "An approved DPIA with retention, deletion, guardian, and incident controls." },
  "partner-rights": { vi: "Quyền tư liệu đối tác", en: "Partner rights and permissions", evidenceVi: "Giấy phép đã ký hoặc quyết định quyền sử dụng kèm thông tin gỡ bỏ.", evidenceEn: "Signed permissions or rights decisions with takedown references." },
  "real-pilot": { vi: "Pilot người học thật", en: "Real-user pilot", evidenceVi: "Quy trình đồng ý, dữ liệu ẩn danh có ngày và so sánh AI/không AI.", evidenceEn: "Consent, dated anonymised participant evidence, and an AI/no-AI comparison." },
  "school-university-reach": { vi: "Tiếp cận trường học và đại học", en: "School and university reach", evidenceVi: "Đối tác trường/đại học có tên và kết quả tiếp cận được xác nhận.", evidenceEn: "Named school/university partners and verified reach results." },
  "independent-security": { vi: "Đánh giá bảo mật độc lập", en: "Independent security review", evidenceVi: "Báo cáo pen-test có phạm vi, xác thực, RBAC, nguồn, AI và khắc phục.", evidenceEn: "A scoped security report covering auth, RBAC, sources, AI, and remediation." },
  "named-operations": { vi: "Người vận hành và trực sự cố", en: "Named operations ownership", evidenceVi: "Lịch trực, escalation, ngân sách, rollback, game-day và RPO/RTO đo được.", evidenceEn: "A named rota, escalation, budget, rollback/game-day, and measured RPO/RTO." },
};

const ownerLabels: Record<string, { vi: string; en: string }> = {
  "Operations owner": { vi: "Người phụ trách vận hành", en: "Operations owner" },
  "Historian Council chair": { vi: "Chủ tịch Hội đồng sử học", en: "Historian Council chair" },
  "AI safety/editorial reviewers": { vi: "Nhóm an toàn AI và biên tập", en: "AI safety/editorial reviewers" },
  "AI owner": { vi: "Người phụ trách AI", en: "AI owner" },
  "Privacy owner": { vi: "Người phụ trách quyền riêng tư", en: "Privacy owner" },
  "Archivist/Rights owner": { vi: "Người phụ trách lưu trữ/quyền", en: "Archivist/Rights owner" },
  "Research lead": { vi: "Trưởng nhóm nghiên cứu", en: "Research lead" },
  "Curriculum/partnership owner": { vi: "Người phụ trách chương trình/đối tác", en: "Curriculum/partnership owner" },
  "Independent security owner": { vi: "Người phụ trách đánh giá bảo mật độc lập", en: "Independent security owner" },
};

export function TransparencyDashboard({ locale, dashboard }: { locale: "vi" | "en"; dashboard: Dashboard }) {
  const vi = locale === "vi";
  const metric = (label: string, value: ReactNode, detail?: ReactNode) => <div className="transparency-metric"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
  const label = (gate: ExternalGate) => gateLabels[gate.id]?.[vi ? "vi" : "en"] ?? gate.id;
  const evidence = (gate: ExternalGate) => gateLabels[gate.id]?.[vi ? "evidenceVi" : "evidenceEn"] ?? gate.requiredEvidence;
  const owner = (gate: ExternalGate) => gate.owner ?? ownerLabels[gate.requiredOwnerRole]?.[vi ? "vi" : "en"] ?? gate.requiredOwnerRole;
  const pending = vi ? "Đang chờ bằng chứng" : "Evidence pending";
  const nextAction = vi ? "Bước tiếp theo" : "Next action";
  return <div className="transparency-dashboard">
    <section className="transparency-status" aria-labelledby="transparency-status-title"><p className="eyebrow">{vi ? "Báo cáo công khai" : "Public report"}</p><h1 id="transparency-status-title">{vi ? "Minh bạch về phạm vi, nguồn và AI" : "Transparency about scope, sources, and AI"}</h1><p>{vi ? "Trang này đọc bằng chứng triển khai và giữ nguyên các blocker. Nó không phải là sự chứng thực của một Hội đồng sử học độc lập." : "This page reports implementation evidence and keeps blockers visible. It is not an independent historian council endorsement."}</p><div className="transparency-release"><span>{vi ? "Trạng thái release" : "Release status"}</span><strong>{dashboard.releaseStatus}</strong></div></section>
    <section className="transparency-grid" aria-label={vi ? "Chỉ số minh bạch" : "Transparency metrics"}>{metric(vi ? "Mandatory coverage" : "Mandatory coverage", String(dashboard.coverage.mandatory))}{metric(vi ? "Media được phục vụ" : "Binary served", dashboard.rights.servedBinary, `${vi ? "LINK_ONLY" : "LINK_ONLY"}: ${dashboard.rights.linkOnly}`)}{metric(vi ? "AI eval" : "AI eval", `${dashboard.ai.actualQuestions}/${dashboard.ai.targetQuestions}`, `${vi ? "Còn thiếu" : "Gap"}: ${dashboard.ai.targetGap}`)}{metric(vi ? "AI public beta" : "Public AI beta", dashboard.ai.publicBeta ? "ENABLED" : "DISABLED", dashboard.ai.status)}{metric(vi ? "Lịch sử biên tập" : "Editorial history", dashboard.contentHistory?.status ?? "—", dashboard.contentHistory ? `${dashboard.contentHistory.candidateCount} ${vi ? "mục chờ duyệt" : "candidates require review"}` : undefined)}{metric(vi ? "Wikimedia metadata" : "Wikimedia metadata", dashboard.wikimedia?.metadataRecords ?? "—", dashboard.wikimedia ? `${dashboard.wikimedia.rightsStatus} · ${dashboard.wikimedia.reviewStatus}` : undefined)}{metric(vi ? "AI config" : "AI config", dashboard.aiComparison?.status ?? "—", dashboard.aiComparison?.humanApproval)}{metric(vi ? "Privacy" : "Privacy", dashboard.privacy.status, dashboard.privacy.publicAi)}{metric(vi ? "Correction SLA" : "Correction SLA", dashboard.corrections.slaHours ? `${dashboard.corrections.slaHours}h` : "—", dashboard.corrections.reporterPublic ? "public reporter data" : "reporter private")}{metric(vi ? "Operations" : "Operations", dashboard.operations.readiness, dashboard.operations.fixedProductionDomain ? "fixed domain" : "no fixed domain")}</section>
    <section className="transparency-blockers" aria-labelledby="transparency-blockers-title"><h2 id="transparency-blockers-title">{vi ? "Blocker trước Public Beta" : "Public Beta blockers"}</h2><ul>{dashboard.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></section>
    <section className="transparency-gates" aria-labelledby="transparency-gates-title"><h2 id="transparency-gates-title">{vi ? "Bằng chứng còn cần trước Public Beta" : "Evidence still needed before Public Beta"}</h2><p>{vi ? "Mỗi mục dưới đây vẫn đang chờ người có thẩm quyền cung cấp bằng chứng. Không có mục nào được coi là đã phê duyệt." : "Each item below still awaits evidence from an authorised owner. None of these items is treated as approved."}</p><div className="transparency-gate-list">{dashboard.externalGates.map((gate) => <details className="transparency-gate" key={gate.id}><summary><span>{label(gate)}</span><strong>{gate.status === "PENDING" ? pending : gate.status}</strong></summary><dl><div><dt>{vi ? "Vai trò cần cung cấp" : "Responsible role"}</dt><dd>{owner(gate)}</dd></div><div><dt>{vi ? "Bằng chứng cần có" : "Required evidence"}</dt><dd>{evidence(gate)}</dd></div><div><dt>{nextAction}</dt><dd>{vi ? "Gán người phụ trách thật và đính kèm artifact có thể kiểm tra; không tự phê duyệt." : "Name the responsible owner and attach a verifiable artifact; do not self-approve."}</dd></div></dl></details>)}</div></section>
    <p className="transparency-disclosure">{dashboard.disclosure}</p>
  </div>;
}
