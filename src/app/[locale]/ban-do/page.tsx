import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoricalMap } from "@/components/public/map/HistoricalMap";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicLocale, t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath, mapPath } from "@/lib/public-client/paths";

export const dynamic = "force-dynamic";
type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params; if (!isPublicLocale(raw)) return {};
  const vi = raw === "vi"; return { title: vi ? "Bản đồ địa danh lịch sử" : "Historical places map", description: vi ? "Bản đồ SVG cục bộ nối địa danh với nội dung lịch sử đã xuất bản." : "A local SVG map connecting places to published history entries.", alternates: { canonical: mapPath(raw), languages: { vi: mapPath("vi"), en: mapPath("en") } } };
}

export default async function HistoricalMapPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }) {
  const { locale: raw } = await params; if (!isPublicLocale(raw)) notFound();
  const query = await searchParams; const precision = one(query.precision); const q = one(query.q); const client = getPublicClient();
  const places = await client.places(raw, new URLSearchParams({ ...(precision ? { precision } : {}), ...(q ? { q } : {}) }));
  const other = raw === "vi" ? "en" : "vi";
  return <PublicShell locale={raw} localeHref={mapPath(other)}><main id="noi-dung" className="listing-main map-main"><nav className="breadcrumbs" aria-label={raw === "vi" ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(raw)}>{t(raw).home}</Link><span>/</span><span aria-current="page">{raw === "vi" ? "Bản đồ" : "Map"}</span></nav><HistoricalMap locale={raw} places={places.data} precision={precision} query={q} /></main></PublicShell>;
}
