import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ContentCard } from "@/components/public/ContentCard";
import { ArrowRightIcon,BookIcon,CalendarIcon,SearchIcon } from "@/components/icons";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { contentPath,homePath,searchPath,timelinePath } from "@/lib/public-client/paths";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;if(!isPublicLocale(locale)) return {};
  const copy=t(locale);const canonical=homePath(locale);const other=locale==="vi"?"en":"vi";
  return {title:copy.homeTitle,description:copy.homeLead,alternates:{canonical,languages:{[locale]:canonical,[other]:homePath(other),"x-default":"/vi"}},openGraph:{title:copy.homeTitle,description:copy.homeLead,url:canonical,type:"website",locale:locale==="vi"?"vi_VN":"en_GB"}};
}

export default async function PublicHome({params}:{params:Promise<{locale:string}>}) {
  const {locale:raw}=await params;if(!isPublicLocale(raw)) notFound();const locale=raw;const copy=t(locale);
  const home=await getPublicClient().home(locale);const other=locale==="vi"?"en":"vi";
  return <PublicShell locale={locale} localeHref={homePath(other)}>
    <main id="noi-dung">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow">{copy.homeEyebrow}</p><h1 id="hero-title">{copy.homeTitle}</h1><p className="hero-lead">{copy.homeLead}</p>
          <div className="hero-buttons"><Link className="button primary" href={timelinePath(locale)}><CalendarIcon/>{copy.exploreTimeline}</Link><Link className="button secondary" href={searchPath(locale)}><SearchIcon/>{copy.lookup}</Link></div>
          <p className="trust-note"><span className="trust-mark" aria-hidden="true"/>{copy.verifiedCopy}</p>
        </div>
        <figure className="hero-art"><picture><source media="(max-width: 760px)" srcSet="/images/hero-history-mobile.webp" type="image/webp"/><source srcSet="/images/hero-history.webp" type="image/webp"/><img src="/images/hero-history.png" width="1536" height="1024" alt={locale==="vi"?"Minh họa lớp bản đồ, núi, thành cổ và hoa văn trống đồng":"Illustrated layers of a map, mountains, citadel, and bronze drum patterns"}/></picture><figcaption>{locale==="vi"?"Minh họa nguyên bản, không phải tư liệu lịch sử":"Original illustration, not a historical document"}</figcaption></figure>
      </section>
      <section className="pulse-strip" aria-label={locale==="vi"?"Quy mô kho tư liệu":"Archive coverage"}>
        <div><strong>{home.counts.PERIOD}</strong><span>{copy.periodUnit}</span></div><div><strong>{home.counts.EVENT}</strong><span>{copy.eventUnit}</span></div><div><strong>{home.counts.PERSON}</strong><span>{copy.personUnit}</span></div><div><strong>{home.counts.ARTIFACT}</strong><span>{copy.artifactUnit}</span></div><p><BookIcon/>{locale==="vi"?"Mỗi nội dung đã xuất bản đều có nguồn":"Every published entry includes a source"}</p>
      </section>
      <section className="section-shell" aria-labelledby="period-title"><div className="section-heading"><div><p className="eyebrow">{copy.timelineEyebrow}</p><h2 id="period-title">{copy.timelineTitle}</h2></div><Link className="text-link" href={timelinePath(locale)}>{copy.allPeriods}<ArrowRightIcon/></Link></div>
        <div className="period-grid">{home.periods.filter((period)=>period.contentCount>0).slice(0,3).map((period)=><article className="period-card" key={period.id}><p className="period-years">{period.startYear}–{period.endYear}</p><h3>{period.title}</h3><p>{period.summary}</p><Link href={timelinePath(locale,`?period=${encodeURIComponent(period.slug)}`)}>{period.contentCount} {copy.eventUnit}<ArrowRightIcon/></Link></article>)}</div>
      </section>
      <section className="feature-section" aria-labelledby="featured-title"><div className="section-heading"><div><p className="eyebrow">{copy.featuredEyebrow}</p><h2 id="featured-title">{copy.featuredTitle}</h2></div><Link className="text-link" href={searchPath(locale)}>{copy.lookup}<ArrowRightIcon/></Link></div><div className="content-grid">{home.featured.slice(0,6).map((item)=><ContentCard item={item} locale={locale} key={item.id}/>)}</div></section>
      <section className="source-promise" id="nguon-tu-lieu"><BookIcon/><div><p className="eyebrow">{copy.navSources}</p><h2>{locale==="vi"?"Đọc lịch sử, lần về tài liệu":"Read the account, trace the evidence"}</h2><p>{locale==="vi"?"Mỗi trang chi tiết đưa nguồn tham khảo, ngày truy cập và nội dung liên quan vào đúng ngữ cảnh.":"Every detail page keeps references, access dates, and related content in context."}</p></div><Link className="button secondary" href={home.featured[0]?contentPath(locale,home.featured[0].type,home.featured[0].slug):searchPath(locale)}>{locale==="vi"?"Mở một nội dung":"Open an entry"}</Link></section>
    </main>
  </PublicShell>;
}
