import Link from "next/link";
import type { Locale, PlaceView } from "@/lib/content/types";
import { contentPath, mapPath } from "@/lib/public-client/paths";

function x(longitude: number) { return ((longitude - 100) / 16) * 100; }
function y(latitude: number) { return 100 - ((latitude - 8) / 16) * 100; }

export function HistoricalMap({ locale, places, precision, query }: { locale: Locale; places: PlaceView[]; precision?: string; query?: string }) {
  const vi = locale === "vi";
  const title = vi ? "Bản đồ địa danh lịch sử" : "Historical places map";
  const lead = vi ? "Đọc các địa danh cùng nội dung đã xuất bản. Điểm xấp xỉ được ghi rõ để không bị hiểu là tọa độ khảo sát hay ranh giới pháp lý." : "Read places alongside published entries. Approximate points are labelled so they are not mistaken for surveys or legal boundaries.";
  const exact = vi ? "Điểm tham chiếu" : "Reference point";
  const approximate = vi ? "Vị trí xấp xỉ" : "Approximate location";
  return <>
    <header className="listing-header map-header"><p className="eyebrow">{vi ? "Không gian và ký ức" : "Place and memory"}</p><h1>{title}</h1><p>{lead}</p></header>
    <form className="map-filter" action={mapPath(locale)} role="search">
      <label htmlFor="map-q">{vi ? "Tìm địa danh" : "Find a place"}<input id="map-q" name="q" defaultValue={query ?? ""} placeholder={vi ? "Ví dụ: Bạch Đằng" : "For example: Bạch Đằng"} /></label>
      <label htmlFor="map-precision">{vi ? "Độ chính xác" : "Precision"}<select id="map-precision" name="precision" defaultValue={precision ?? ""}><option value="">{vi ? "Tất cả" : "All"}</option><option value="EXACT">{exact}</option><option value="APPROXIMATE">{approximate}</option></select></label>
      <button className="button primary" type="submit">{vi ? "Lọc bản đồ" : "Filter map"}</button>
      {precision || query ? <Link className="text-link" href={mapPath(locale)}>{vi ? "Xóa bộ lọc" : "Clear filters"}</Link> : null}
    </form>
    <div className="historical-map-layout">
      <figure className="historical-map-figure" aria-labelledby="map-title" data-testid="historical-map">
        <figcaption id="map-title"><strong>{vi ? "Sơ đồ định vị giáo dục" : "Educational locator diagram"}</strong><span>{vi ? "SVG cục bộ · không tải bản đồ nền bên ngoài" : "Local SVG · no external basemap"}</span></figcaption>
        <svg className="historical-map-svg" viewBox="0 0 100 100" role="img" aria-labelledby="map-title map-description" preserveAspectRatio="none" aria-hidden="true">
          <title id="map-description">{vi ? "Các điểm địa danh lịch sử được đặt theo kinh độ và vĩ độ với chú thích độ chính xác." : "Historical places positioned by longitude and latitude with precision labels."}</title>
          <path className="map-land" d="M45 5 C49 12 48 18 53 23 C56 27 52 33 57 38 C62 44 60 50 65 57 C69 64 65 69 68 76 C70 82 66 89 63 95 L48 95 C50 87 46 82 45 75 C43 66 45 60 42 54 C39 47 42 39 40 34 C38 27 42 20 40 14 Z" />
          <path className="map-grid-line" d="M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100" />
        </svg>
        <div className="map-marker-layer" aria-label={vi ? "Điểm địa danh" : "Place markers"}>{places.map((place) => <a key={place.id} href={`#${place.id}`} className={`map-marker ${place.precision === "APPROXIMATE" ? "approximate" : "exact"}`} style={{ left: `${x(place.point.longitude)}%`, top: `${y(place.point.latitude)}%` }} aria-label={`${place.title} — ${place.precision === "APPROXIMATE" ? approximate : exact}`}><span aria-hidden="true">{place.precision === "APPROXIMATE" ? "~" : "•"}</span></a>)}</div>
        <p className="map-fallback-note">{vi ? "Nếu trình duyệt không hiển thị SVG, danh sách HTML dưới đây vẫn chứa toàn bộ địa danh, độ chính xác và liên kết học tập." : "If SVG is unavailable, the HTML list below still contains every place, precision note, and learning link."}</p>
      </figure>
      <section className="map-place-list" aria-labelledby="place-list-title"><div className="section-heading"><div><p className="eyebrow">{vi ? "Danh sách có thể truy cập" : "Accessible list"}</p><h2 id="place-list-title">{places.length} {vi ? "địa danh" : "places"}</h2></div></div>{places.length ? <ol>{places.map((place) => <li id={place.id} key={place.id} className="map-place-card"><div className="map-place-heading"><span className={`precision-chip ${place.precision === "APPROXIMATE" ? "approximate" : "exact"}`}>{place.precision === "APPROXIMATE" ? approximate : exact}</span><h3>{place.title}</h3></div><p>{place.summary}</p><p className="map-place-locator">{place.locatorNote}</p>{place.related.length ? <div className="map-related"><strong>{vi ? "Đọc tiếp" : "Read next"}</strong>{place.related.map((item) => <Link key={item.id} href={contentPath(locale, item.type, item.slug)}>{item.title}</Link>)}</div> : <p className="map-no-related">{vi ? "Đang bổ sung nội dung liên quan đã xuất bản." : "Published related entries are being added."}</p>}</li>)}</ol> : <div className="empty-state"><h3>{vi ? "Không có địa danh phù hợp" : "No matching places"}</h3><p>{vi ? "Thử xóa bộ lọc hoặc dùng từ khóa ngắn hơn." : "Clear a filter or use a shorter search."}</p></div>}</section>
    </div>
  </>;
}
