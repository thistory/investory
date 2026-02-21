// Root layout — only provides the html/body shell for non-locale routes.
// All locale-specific rendering is handled by [locale]/layout.tsx.
// This file exists to satisfy Next.js's requirement for a root layout.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
