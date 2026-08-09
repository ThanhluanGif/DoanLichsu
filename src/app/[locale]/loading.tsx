import { BrandMark } from "@/components/BrandMark";

export default function Loading(){
  return <>
    <title>Quân Sử Việt — Đang tải / Loading</title>
    <main
      className="brand-loading"
      id="noi-dung"
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung / Loading content"
    >
      <span className="brand-loading-emblem" data-brand-loader aria-hidden="true">
        <span className="brand-loading-ripple brand-loading-ripple-one"/>
        <span className="brand-loading-ripple brand-loading-ripple-two"/>
        <BrandMark className="brand-loading-mark"/>
      </span>
    </main>
  </>;
}
