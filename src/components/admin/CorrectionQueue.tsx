"use client";

/* eslint-disable react-hooks/set-state-in-effect -- effects only schedule authenticated HTTP loads */

import { useCallback, useEffect, useState } from "react";
import { adminErrorMessage, adminGet, adminSend, list } from "@/lib/admin-client/client";
import type { AdminCorrectionView, CorrectionCategory, CorrectionState, CorrectionUrgency, ListResponse } from "@/lib/admin-client/types";
import { canReview } from "@/lib/admin-client/navigation";
import { useAdmin } from "./AdminShell";

const stateLabels: Record<CorrectionState, string> = { RECEIVED: "Mới nhận", TRIAGED: "Đã phân loại", IN_REVIEW: "Đang kiểm tra", NEEDS_COUNCIL: "Chờ Hội đồng", CORRECTED: "Đã xử lý", DECLINED: "Từ chối có lý do", ARCHIVED: "Đã lưu" };
const categoryLabels: Record<CorrectionCategory, string> = { FACTUAL: "Dữ kiện", SOURCE: "Nguồn", TRANSLATION: "Bản dịch", ACCESSIBILITY: "Tiếp cận", SAFETY: "An toàn", RIGHTS: "Quyền" };
const urgencyLabels: Record<CorrectionUrgency, string> = { NORMAL: "Thường", HIGH: "Cao", CRITICAL: "Nghiêm trọng" };
const date = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function nextStates(item: AdminCorrectionView, reviewer: boolean): CorrectionState[] {
  const states: Record<CorrectionState, CorrectionState[]> = { RECEIVED: ["TRIAGED"], TRIAGED: ["IN_REVIEW"], IN_REVIEW: [], NEEDS_COUNCIL: ["IN_REVIEW"], CORRECTED: [], DECLINED: [], ARCHIVED: [] };
  if (reviewer) {
    states.RECEIVED.push("DECLINED"); states.TRIAGED.push("NEEDS_COUNCIL", "DECLINED");
    states.IN_REVIEW.push("NEEDS_COUNCIL", "CORRECTED", "DECLINED"); states.NEEDS_COUNCIL.push("CORRECTED", "DECLINED");
    states.CORRECTED.push("ARCHIVED"); states.DECLINED.push("ARCHIVED");
  }
  return states[item.state];
}

export function CorrectionQueue() {
  const { user } = useAdmin();
  const reviewer = canReview(user.role);
  const [items, setItems] = useState<AdminCorrectionView[]>([]);
  const [state, setState] = useState(""); const [category, setCategory] = useState(""); const [urgency, setUrgency] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({}); const [message, setMessage] = useState("");
  const load = useCallback(async () => { try { const query = new URLSearchParams({ pageSize: "100", ...(state ? { state } : {}), ...(category ? { category } : {}), ...(urgency ? { urgency } : {}) }); setItems(list(await adminGet<ListResponse<AdminCorrectionView>>(`/api/v1/admin/corrections?${query}`))); setMessage(""); } catch (error) { setMessage(adminErrorMessage(error)); } }, [state, category, urgency]);
  useEffect(() => { void load(); }, [load]);
  const transition = async (item: AdminCorrectionView, nextState: CorrectionState) => { const reason = reasons[item.id]?.trim() ?? ""; if (!reason) { setMessage("Mỗi chuyển trạng thái cần ghi lý do."); return; } try { await adminSend(`/api/v1/admin/corrections/${item.id}/transition`, "POST", { version: item.version, state: nextState, reason }); setMessage(`Đã chuyển ${item.id} sang ${stateLabels[nextState]}.`); await load(); } catch (error) { setMessage(adminErrorMessage(error)); } };
  return <div className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Correction moderation</p><h1>Báo lỗi cần xử lý</h1><p>Queue chỉ chứa dữ liệu tối thiểu; mọi chuyển trạng thái cần lý do và audit actor. Không thao tác nào tự sửa nội dung công khai.</p></div></header><form className="admin-filter" onSubmit={(event) => { event.preventDefault(); void load(); }}><label>Trạng thái<select value={state} onChange={(event) => setState(event.target.value)}><option value="">Tất cả</option>{Object.entries(stateLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Loại<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tất cả</option>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Mức độ<select value={urgency} onChange={(event) => setUrgency(event.target.value)}><option value="">Tất cả</option>{Object.entries(urgencyLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="button secondary" type="submit">Lọc queue</button></form>{message ? <p className="form-alert" role="alert">{message}</p> : null}<div className="admin-table correction-queue" role="table" aria-label="Hàng đợi báo lỗi">{items.map((item) => { const available = nextStates(item, reviewer); return <div className="correction-row" role="row" key={item.id}><div><strong>{item.contentTitle}</strong><small>{item.id} · {categoryLabels[item.category]} · {urgencyLabels[item.urgency]} · version {item.version}</small></div><div><span className={`status-chip status-${item.state.toLowerCase()}`}>{stateLabels[item.state]}</span>{item.overdue ? <span className="status-chip status-rejected">Quá SLA</span> : <small>Hạn mục tiêu {item.slaHours}h</small>}</div><p>{item.description}</p><a href={item.evidenceLocator} target="_blank" rel="noreferrer">Mở evidence locator</a><time>{date(item.receivedAt)}</time>{available.length ? <div className="correction-actions"><label>Lý do chuyển trạng thái<textarea rows={2} value={reasons[item.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} required/></label>{available.map((next) => <button className="button secondary" type="button" key={next} onClick={() => void transition(item, next)}>{stateLabels[next]}</button>)}</div> : null}</div>; })}{!items.length && !message ? <p className="admin-empty">Không có báo cáo phù hợp.</p> : null}</div></div>;
}
