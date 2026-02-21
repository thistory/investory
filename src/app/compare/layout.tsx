import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "종목 비교",
  description: "두 종목의 투자 지표를 나란히 비교 분석합니다",
  robots: { index: false },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
