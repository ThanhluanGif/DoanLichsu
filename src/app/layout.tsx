import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN?.trim() || "http://127.0.0.1:3000"),
  title: {default:"Quân Sử Việt",template:"%s · Quân Sử Việt"},
  description: "Kho tư liệu song ngữ về lịch sử quân sự Việt Nam.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
