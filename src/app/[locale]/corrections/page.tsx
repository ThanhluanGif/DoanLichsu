import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CorrectionForm } from "@/components/public/CorrectionForm";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicLocale } from "@/lib/i18n/config";
import { homePath } from "@/lib/public-client/paths";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isPublicLocale(locale)) return {};
  return { title: locale === "vi" ? "Báo lỗi và đính chính" : "Report a correction" };
}

export default async function CorrectionsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ contentId?: string }> }) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  const { contentId } = await searchParams;
  const vi = locale === "vi";
  return <PublicShell locale={locale} localeHref={locale === "vi" ? "/en/corrections" : "/vi/corrections"}>
    <main id="noi-dung" className="listing-main transparency-main">
      <nav className="breadcrumbs" aria-label={vi ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(locale)}>{vi ? "Trang chủ" : "Home"}</Link><span>/</span><span aria-current="page">{vi ? "Báo lỗi" : "Corrections"}</span></nav>
      <header className="listing-header"><p className="eyebrow">{vi ? "Cùng giữ nguồn được rõ ràng" : "Help keep the record accountable"}</p><h1>{vi ? "Báo lỗi hoặc đề nghị đính chính" : "Report a correction"}</h1><p>{vi ? "Gửi thông tin về nguồn, dữ kiện, bản dịch, khả năng tiếp cận, an toàn hoặc quyền tư liệu. Không cần tạo tài khoản; báo cáo chỉ vào hàng đợi kiểm duyệt và không tự thay đổi nội dung." : "Report a factual, source, translation, accessibility, safety, or rights issue. No account is needed; reports enter moderation and never change public content automatically."}</p></header>
      <section className="transparency-method correction-intro"><h2>{vi ? "Trước khi gửi" : "Before you send"}</h2><ul><li>{vi ? "Chỉ gửi thông tin cần cho việc kiểm tra; không ghi họ tên, trường, địa chỉ, email hoặc số điện thoại." : "Share only what is needed to check the issue; do not include names, schools, addresses, email addresses, or phone numbers."}</li><li>{vi ? "Báo cáo về quyền tư liệu hoặc an toàn được đặt mục tiêu xử lý trong 24 giờ; loại khác trong 72 giờ." : "Rights and safety reports target triage within 24 hours; other reports within 72 hours."}</li><li>{vi ? "Chính sách hiện ở trạng thái chờ Hội đồng ký; receipt không phải cam kết sửa lỗi hay phê duyệt nội dung." : "The policy still awaits Council sign-off; a receipt is not a promise to change or approve content."}</li></ul></section>
      <CorrectionForm locale={locale} initialContentId={contentId ?? ""}/>
    </main>
  </PublicShell>;
}
