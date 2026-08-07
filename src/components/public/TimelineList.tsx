import Link from "next/link";
import type { Locale,TimelineItem } from "@/lib/content/types";
import { contentPath } from "@/lib/public-client/paths";
import { formatDateRange } from "@/lib/public-client/presentation";

export function TimelineList({items,locale}:{items:TimelineItem[];locale:Locale}) {
  return <div className="timeline-list" role="list">
    {items.map((item) => <article className="timeline-entry" role="listitem" key={item.id}>
      <div className="timeline-date"><time dateTime={item.startDate ?? undefined}>{formatDateRange(item,locale)}</time></div>
      <div className="timeline-dot" aria-hidden="true"/>
      <div className="timeline-entry-copy">
        {item.period ? <p>{item.period.title}</p> : null}
        <h2><Link href={contentPath(locale,"EVENT",item.slug)}>{item.title}</Link></h2>
        <p>{item.summary}</p>
      </div>
    </article>)}
  </div>;
}
