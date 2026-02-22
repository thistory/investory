import { requirePageAdmin } from "@/lib/auth/require-page-auth";
import CompareClient from "./compare-client";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requirePageAdmin(locale);

  return <CompareClient />;
}
