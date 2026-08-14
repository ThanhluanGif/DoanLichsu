"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/content/types";

type Props = { locale: Locale; initialContentId: string };
type Receipt = { id: string; state: "RECEIVED"; receivedAt: string; slaHours: 24 | 72; reporterStored: false };

export function CorrectionForm({ locale, initialContentId }: Props) {
  const vi = locale === "vi";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [values, setValues] = useState({ contentId: initialContentId, category: "FACTUAL", description: "", evidenceLocator: "", urgency: "NORMAL", consent: false, website: "" });
  const update = (name: string, value: string | boolean) => setValues((current) => ({ ...current, [name]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setReceipt(null);
    try {
      const response = await fetch("/api/v1/corrections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, consent: values.consent ? "yes" : "no" }) });
      const payload = await response.json() as { data?: Receipt; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message ?? (vi ? "Không thể gửi báo cáo." : "The report could not be sent."));
      setReceipt(payload.data); setValues((current) => ({ ...current, description: "", evidenceLocator: "", consent: false, website: "" }));
    } catch (next) { setError(next instanceof Error ? next.message : (vi ? "Không thể gửi báo cáo." : "The report could not be sent.")); }
    finally { setBusy(false); }
  }
  if (receipt) return <section className="correction-receipt success-alert" aria-live="polite"><h2>{vi ? "Đã tiếp nhận báo cáo" : "Report received"}</h2><p>{vi ? `Mã tiếp nhận: ${receipt.id}. Mục tiêu phản hồi ban đầu: ${receipt.slaHours} giờ.` : `Receipt: ${receipt.id}. Initial triage target: ${receipt.slaHours} hours.`}</p><p>{vi ? "Báo cáo không lưu danh tính người gửi và chưa làm thay đổi nội dung công khai." : "The report stores no reporter identity and has not changed public content."}</p><button className="button secondary" type="button" onClick={() => setReceipt(null)}>{vi ? "Gửi báo cáo khác" : "Send another report"}</button></section>;
  return <form className="correction-form" onSubmit={submit} noValidate>
    <div className="correction-grid">
      <label>{vi ? "Mã nội dung đã xuất bản" : "Published content ID"}<input name="contentId" value={values.contentId} onChange={(event) => update("contentId", event.target.value)} placeholder="event-bach-dang-1288" required/></label>
      <label>{vi ? "Loại báo cáo" : "Report type"}<select name="category" value={values.category} onChange={(event) => update("category", event.target.value)}><option value="FACTUAL">{vi ? "Dữ kiện" : "Factual"}</option><option value="SOURCE">{vi ? "Nguồn" : "Source"}</option><option value="TRANSLATION">{vi ? "Bản dịch" : "Translation"}</option><option value="ACCESSIBILITY">{vi ? "Khả năng tiếp cận" : "Accessibility"}</option><option value="SAFETY">{vi ? "An toàn" : "Safety"}</option><option value="RIGHTS">{vi ? "Quyền tư liệu" : "Rights"}</option></select></label>
    </div>
    <label>{vi ? "Mô tả điều cần kiểm tra" : "What should be checked?"}<textarea name="description" rows={6} minLength={12} maxLength={2000} value={values.description} onChange={(event) => update("description", event.target.value)} required/></label>
    <label>{vi ? "Evidence locator / URL / mã hồ sơ" : "Evidence locator / URL / record ID"}<input name="evidenceLocator" value={values.evidenceLocator} onChange={(event) => update("evidenceLocator", event.target.value)} required/></label>
    <label>{vi ? "Mức khẩn cấp" : "Urgency"}<select name="urgency" value={values.urgency} onChange={(event) => update("urgency", event.target.value)}><option value="NORMAL">{vi ? "Thông thường" : "Normal"}</option><option value="HIGH">{vi ? "Cao" : "High"}</option><option value="CRITICAL">{vi ? "Nghiêm trọng" : "Critical"}</option></select></label>
    <label className="check-label"><input type="checkbox" name="consent" checked={values.consent} onChange={(event) => update("consent", event.target.checked)} required/>{vi ? "Tôi đồng ý để Quân Sử Việt lưu tối thiểu báo cáo này cho mục đích kiểm tra và moderation." : "I consent to minimum storage of this report for checking and moderation."}</label>
    <label className="correction-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={(event) => update("website", event.target.value)}/></label>
    {error ? <p className="form-alert" role="alert">{error}</p> : null}
    <button className="button primary" type="submit" disabled={busy}>{busy ? (vi ? "Đang gửi…" : "Sending…") : (vi ? "Gửi báo cáo" : "Send report")}</button>
  </form>;
}
