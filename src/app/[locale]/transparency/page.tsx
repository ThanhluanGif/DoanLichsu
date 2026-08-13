import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { TransparencyDashboard } from "@/components/public/TransparencyDashboard";
import { isPublicLocale } from "@/lib/i18n/config";
import dashboard from "../../../../artifacts/transparency/dashboard.json";

export const dynamic = "force-dynamic";
export default function EnglishTransparency({ params }: { params: Promise<{ locale: string }> }) { void params; if (!isPublicLocale("en")) notFound(); return <PublicShell locale="en" localeHref="/vi/minh-bach"><main id="noi-dung" className="listing-main transparency-main"><TransparencyDashboard locale="en" dashboard={dashboard} /></main></PublicShell>; }
