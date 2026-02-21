import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://investory.kro.kr"),
  title: {
    default: "Investory — 데이터 기반 미국 주식 투자 분석",
    template: "%s | Investory",
  },
  description:
    "월가 방법론을 체계적으로 수치화하여 감이 아닌 근거로 투자 판단을 돕는 미국 주식 분석 플랫폼",
  keywords: [
    "미국 주식",
    "주식 분석",
    "투자 분석",
    "밸류에이션",
    "종목 분석",
    "Investory",
  ],
  authors: [{ name: "Investory" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Investory",
    images: [
      {
        url: "/logo-full.png",
        width: 743,
        height: 743,
        alt: "Investory",
      },
    ],
  },
  twitter: {
    card: "summary",
    images: ["/logo-full.png"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
