import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicLocale } from "@/lib/i18n/config";
import { homePath } from "@/lib/public-client/paths";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return { title: locale === "vi" ? "Riêng tư và an toàn AI" : "Privacy and AI safety" };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  const vi = locale === "vi";
  const otherPath = locale === "vi" ? "/en/privacy" : "/vi/privacy";
  return <PublicShell locale={locale} localeHref={otherPath}><main id="noi-dung" className="listing-main transparency-main">
    <nav className="breadcrumbs" aria-label={vi ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(locale)}>{vi ? "Trang chủ" : "Home"}</Link><span>/</span><span aria-current="page">{vi ? "Riêng tư và an toàn" : "Privacy and safety"}</span></nav>
    <header className="listing-header"><p className="eyebrow">{vi ? "Thông báo công khai" : "Public notice"}</p><h1>{vi ? "Riêng tư, trẻ em và trợ giảng AI" : "Privacy, children and the AI tutor"}</h1><p>{vi ? "Trang này mô tả các kiểm soát đang triển khai. Đây chưa phải là phê duyệt DPIA hoặc tư vấn pháp lý." : "This notice describes implemented controls. It is not DPIA approval or legal advice."}</p></header>
    <section className="transparency-method"><h2>{vi ? "Dữ liệu tối thiểu" : "Data minimisation"}</h2><ul><li>{vi ? "Kho công khai không yêu cầu tài khoản học sinh; không chủ động thu họ tên, trường, số điện thoại, vị trí chính xác hay hồ sơ nhạy cảm." : "The public archive does not require a learner account; we do not intentionally collect names, schools, phone numbers, precise location or sensitive profiles."}</li><li>{vi ? "Phân tích được tổng hợp theo nhóm tối thiểu và không dùng để lập hồ sơ trẻ em." : "Analytics are aggregated with a minimum group size and are not used to profile children."}</li></ul></section>
    <section className="transparency-method"><h2>{vi ? "AI đang ở internal alpha" : "AI is internal alpha"}</h2><ul><li>{vi ? "AI công khai đang tắt. Trợ giảng chỉ dành cho phiên được cấp quyền, dựa trên corpus đã duyệt, và phải có citation hoặc từ chối hữu ích." : "Public AI is disabled. The tutor is restricted to invited sessions, uses an approved corpus, and must provide citations or a useful abstention."}</li><li>{vi ? "Không dùng câu hỏi để huấn luyện mặc định; route hiện tại không lưu transcript." : "Questions are not used for default model training; the current route does not persist transcripts."}</li></ul></section>
    <section className="transparency-method"><h2>{vi ? "Lưu trữ, xóa và sự cố" : "Retention, deletion and incidents"}</h2><ul><li>{vi ? "Mục tiêu chính sách: xóa prompt/transcript trong 30 ngày nếu không có safety/legal hold; yêu cầu xóa hoặc đính chính được triage trong 1–3 ngày làm việc." : "Policy target: delete prompts/transcripts within 30 days unless a safety/legal hold applies; deletion or correction requests are triaged within 1–3 business days."}</li><li>{vi ? "Sự cố quyền riêng tư, an toàn hoặc quyền tư liệu có thể khiến tính năng bị tắt tạm thời để điều tra và ghi audit tối thiểu." : "Privacy, safety or rights incidents may trigger a temporary feature disable while minimal audit evidence is preserved."}</li><li>{vi ? "DPIA và quy trình pilot trẻ vị thành niên vẫn chờ người phụ trách thật phê duyệt trước Public Beta." : "The DPIA and minor-participant pilot process still require named human approval before Public Beta."}</li></ul></section>
    <p className="transparency-disclosure">{vi ? "Trạng thái: DRAFT_PENDING_PRIVACY_REVIEW. Xem thêm báo cáo minh bạch để biết các blocker trước Public Beta." : "Status: DRAFT_PENDING_PRIVACY_REVIEW. See the transparency report for all Public Beta blockers."}</p>
  </main></PublicShell>;
}
