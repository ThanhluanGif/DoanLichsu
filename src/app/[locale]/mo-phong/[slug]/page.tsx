import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ReconstructionScene } from "@/components/public/reconstruction/ReconstructionScene";
import { isPublicLocale, t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { homePath, reconstructionPath } from "@/lib/public-client/paths";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale: raw, slug } = await params; if (!isPublicLocale(raw)) return {}; return { title: raw === "vi" ? "Bạch Đằng 1288 — Tái dựng giáo dục" : "Bạch Đằng 1288 — Educational reconstruction", alternates: { canonical: reconstructionPath(raw, slug), languages: { vi: reconstructionPath("vi", slug), en: reconstructionPath("en", slug) } } }; }
export default async function ReconstructionDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) { const { locale: raw, slug } = await params; if (!isPublicLocale(raw)) notFound(); const scene = await getPublicClient().reconstruction(raw, slug).catch(() => null); if (!scene) notFound(); const other = raw === "vi" ? "en" : "vi"; return <PublicShell locale={raw} localeHref={reconstructionPath(other, slug)}><main id="noi-dung" className="listing-main reconstruction-main"><nav className="breadcrumbs" aria-label={raw === "vi" ? "Đường dẫn" : "Breadcrumb"}><Link href={homePath(raw)}>{t(raw).home}</Link><span>/</span><Link href={reconstructionPath(raw)}>{raw === "vi" ? "Tái dựng" : "Reconstructions"}</Link><span>/</span><span aria-current="page">{scene.title}</span></nav><ReconstructionScene locale={raw} scene={scene} /></main></PublicShell>; }
