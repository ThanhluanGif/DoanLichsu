import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { TransparencyDashboard } from "@/components/public/TransparencyDashboard";
import { isPublicLocale } from "@/lib/i18n/config";
import dashboard from "../../../../artifacts/transparency/dashboard.json";

export const dynamic = "force-dynamic";
export default function VietnameseTransparency({ params }: { params: Promise<{ locale: string }> }) { void params; if (!isPublicLocale("vi")) notFound(); return <PublicShell locale="vi" localeHref="/en/transparency"><main id="noi-dung" className="listing-main transparency-main"><TransparencyDashboard locale="vi" dashboard={dashboard} /></main></PublicShell>; }
