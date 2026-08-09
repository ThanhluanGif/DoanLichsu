import Image from "next/image";
import Link from "next/link";
import type { ContentListItem,Locale } from "@/lib/content/types";
import { ArrowRightIcon } from "@/components/icons";
import { contentArtwork } from "@/lib/public-client/artwork";
import { contentPath } from "@/lib/public-client/paths";
import { formatDateRange,typeLabel } from "@/lib/public-client/presentation";

export function ContentCard({item,locale,variant="default"}:{item:ContentListItem;locale:Locale;variant?:"default"|"compact"}) {
  const artwork=contentArtwork(item.id,locale);
  return <article className={`content-card ${variant}`}>
    <div className={`content-card-art type-${item.type.toLowerCase()}${artwork?" has-image":""}`} aria-hidden="true">{artwork?<Image unoptimized src={artwork.src} alt="" width="1280" height="853" loading="lazy" decoding="async" data-featured-art={item.id}/>:null}<span>{typeLabel(locale,item.type)}</span></div>
    <div className="content-card-copy">
      <p className="content-meta"><span>{typeLabel(locale,item.type)}</span>{item.startDate ? <time dateTime={item.startDate}>{formatDateRange(item,locale)}</time> : null}</p>
      <h3><Link href={contentPath(locale,item.type,item.slug)}>{item.title}</Link></h3>
      <p>{item.summary}</p>
      <Link className="card-link" href={contentPath(locale,item.type,item.slug)} aria-label={`${locale === "vi" ? "Đọc" : "Read"} ${item.title}`}><ArrowRightIcon/></Link>
    </div>
  </article>;
}
