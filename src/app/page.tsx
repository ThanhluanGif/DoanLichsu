import Link from "next/link";

export default function HomePage() {
  return (
    <main className="foundation-shell" id="noi-dung">
      <div className="foundation-card">
        <div className="brand" aria-label="Quân Sử Việt">
          <span className="brand-mark" aria-hidden="true">QS</span>
          <span>
            <strong>Quân Sử Việt</strong>
            <small>Kho tư liệu song ngữ</small>
          </span>
        </div>
        <p className="eyebrow">Nền tảng đang được hoàn thiện</p>
        <h1>Lịch sử được kể rõ ràng và có nguồn kiểm chứng.</h1>
        <p className="foundation-copy">
          Runtime nền tảng đã sẵn sàng. Nội dung công khai và không gian biên tập sẽ được
          đưa vào ở các bản tiếp theo.
        </p>
        <div className="foundation-actions">
          <Link className="button primary" href="/docs">Xem tài liệu API</Link>
          <Link className="button secondary" href="/healthz">Kiểm tra hệ thống</Link>
        </div>
      </div>
    </main>
  );
}
