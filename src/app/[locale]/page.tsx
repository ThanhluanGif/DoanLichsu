import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ContentCard } from "@/components/public/ContentCard";
import { ArrowRightIcon,BookIcon,CalendarIcon,SearchIcon } from "@/components/icons";
import { isPublicLocale,t } from "@/lib/i18n/config";
import { getPublicClient } from "@/lib/public-client/client";
import { contentCollectionPath,homePath,searchPath,sourcesPath,timelinePath } from "@/lib/public-client/paths";

const periodArtwork:Record<string,{src:string;alt:{vi:string;en:string}}>={
  "period-early":{src:"/images/periods/early-self-rule.webp",alt:{vi:"Minh họa thuyền, bãi cọc và thành lũy bên sông trong buổi đầu tự chủ",en:"Illustration of boats, river stakes, and fortifications in the early era of self-rule"}},
  "period-dynasties":{src:"/images/periods/dynastic-defense.webp",alt:{vi:"Minh họa thành lũy, tháp canh và thủy quân bảo vệ quốc gia thời quân chủ",en:"Illustration of fortifications, watchtowers, and river forces defending the dynastic state"}},
  "period-colonial":{src:"/images/periods/anti-colonial-resistance.webp",alt:{vi:"Minh họa làng phòng thủ, đường liên lạc và địa hình kháng chiến chống thực dân",en:"Illustration of a defended village, communication route, and anti-colonial resistance landscape"}},
  "period-independence-wars":{src:"/images/periods/independence-reunification.webp",alt:{vi:"Minh họa tuyến hậu cần xe đạp qua núi rừng trong chiến tranh giành độc lập và thống nhất",en:"Illustration of bicycle logistics through mountain forests during the wars for independence and reunification"}},
  "period-border":{src:"/images/periods/post-1975-border-defense.webp",alt:{vi:"Minh họa đồn và tuyến tuần tra trên vùng biên giới sau năm 1975",en:"Illustration of a border post and patrol route after 1975"}},
  "period-memory":{src:"/images/periods/contemporary-memory.webp",alt:{vi:"Minh họa bảo tàng, lưu trữ và công chúng tiếp cận di sản quân sự đương đại",en:"Illustration of a museum, archives, and public engagement with contemporary military heritage"}},
};

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;if(!isPublicLocale(locale)) return {};
  const copy=t(locale);const canonical=homePath(locale);const other=locale==="vi"?"en":"vi";
  return {title:copy.homeTitle,description:copy.homeLead,alternates:{canonical,languages:{[locale]:canonical,[other]:homePath(other),"x-default":"/vi"}},openGraph:{title:copy.homeTitle,description:copy.homeLead,url:canonical,type:"website",locale:locale==="vi"?"vi_VN":"en_GB"}};
}

export default async function PublicHome({params}:{params:Promise<{locale:string}>}) {
  const {locale:raw}=await params;if(!isPublicLocale(raw)) notFound();const locale=raw;const copy=t(locale);
  const home=await getPublicClient().home(locale);const other=locale==="vi"?"en":"vi";const collectionUnits={PERIOD:copy.periodUnit,EVENT:copy.eventUnit,PERSON:copy.personUnit,ARTIFACT:copy.artifactUnit} as const;
  return <PublicShell locale={locale} localeHref={homePath(other)}>
    <main id="noi-dung">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow">{copy.homeEyebrow}</p><h1 id="hero-title">{copy.homeTitle}</h1><p className="hero-lead">{copy.homeLead}</p>
          <div className="hero-buttons"><Link className="button primary" href={timelinePath(locale)}><CalendarIcon/>{copy.exploreTimeline}</Link><Link className="button secondary" href={searchPath(locale)}><SearchIcon/>{copy.lookup}</Link></div>
          <p className="trust-note"><span className="trust-mark" aria-hidden="true"/>{copy.verifiedCopy}</p>
        </div>
        <figure className="hero-art"><picture><source media="(max-width: 760px)" srcSet="/images/hero-history-mobile.webp" type="image/webp"/><source srcSet="/images/hero-history.webp" type="image/webp"/><img src="/images/hero-history.png" width="1536" height="1024" fetchPriority="high" decoding="async" alt={locale==="vi"?"Minh họa lớp bản đồ, núi, thành cổ và hoa văn trống đồng":"Illustrated layers of a map, mountains, citadel, and bronze drum patterns"}/></picture><figcaption>{locale==="vi"?"Minh họa nguyên bản, không phải tư liệu lịch sử":"Original illustration, not a historical document"}</figcaption></figure>
      </section>
      <section className="pulse-strip" aria-label={locale==="vi"?"Quy mô kho tư liệu":"Archive coverage"}>
        {(["PERIOD","EVENT","PERSON","ARTIFACT"] as const).map((type)=><Link href={contentCollectionPath(locale,type)} aria-label={`${locale==="vi"?"Xem":"Browse"} ${home.counts[type]} ${collectionUnits[type]}`} key={type}><strong>{home.counts[type]}</strong><span>{collectionUnits[type]}</span><ArrowRightIcon/></Link>)}<p><BookIcon/>{locale==="vi"?"Mỗi nội dung đã xuất bản đều có nguồn":"Every published entry includes a source"}</p>
      </section>
      <section className="section-shell" aria-labelledby="period-title"><div className="section-heading"><div><p className="eyebrow">{copy.timelineEyebrow}</p><h2 id="period-title">{copy.timelineTitle}</h2></div><Link className="text-link" href={timelinePath(locale)}>{copy.allPeriods}<ArrowRightIcon/></Link></div>
        <div className="period-grid">{home.periods.filter((period)=>period.contentCount>0).map((period)=>{const artwork=periodArtwork[period.id];return <article className="period-card" key={period.id}>{artwork?<figure className="period-art"><Image unoptimized data-period-art={period.id} src={artwork.src} width="1280" height="853" loading="lazy" decoding="async" alt={artwork.alt[locale]}/></figure>:null}<div className="period-card-body"><p className="period-years">{period.startYear}–{period.endYear}</p><h3>{period.title}</h3><p>{period.summary}</p><Link href={timelinePath(locale,`?period=${encodeURIComponent(period.slug)}`)}>{period.contentCount} {copy.eventUnit}<ArrowRightIcon/></Link></div></article>;})}</div>
        <p className="period-art-note">{locale==="vi"?"Các hình ảnh trong phần này là minh họa nguyên bản, không phải tư liệu lịch sử.":"Images in this section are original illustrations, not historical documents."}</p>
      </section>
      <section className="feature-section" aria-labelledby="featured-title"><div className="section-heading"><div><p className="eyebrow">{copy.featuredEyebrow}</p><h2 id="featured-title">{copy.featuredTitle}</h2></div><Link className="text-link" href={searchPath(locale)}>{copy.lookup}<ArrowRightIcon/></Link></div><div className="content-grid">{home.featured.slice(0,6).map((item)=><ContentCard item={item} locale={locale} key={item.id}/>)}</div></section>
      <section className="source-promise" id="nguon-tu-lieu"><BookIcon/><div><p className="eyebrow">{copy.navSources}</p><h2>{locale==="vi"?"Đọc lịch sử, lần về tài liệu":"Read the account, trace the evidence"}</h2><p>{locale==="vi"?"Trang danh mục tập hợp các nguồn tham khảo đã dùng trong nội dung xuất bản, mỗi đường dẫn chỉ xuất hiện một lần.":"The directory gathers references used by published entries, with each destination shown once."}</p></div><Link className="button secondary" href={sourcesPath(locale)}>{copy.sourceDirectoryCta}</Link></section>
    </main>
  </PublicShell>;
}
