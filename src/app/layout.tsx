import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quân Sử Việt",
  description: "Kho tư liệu song ngữ về lịch sử quân sự Việt Nam.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a>
        {children}
      </body>
    </html>
  );
}
