import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import LockScreen from "@/components/ui/LockScreen";
import CompareClient from "./compare-client";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    const t = await getTranslations({ locale, namespace: "lockScreen" });
    return (
      <LockScreen
        locale={locale}
        title={t("compare.title")}
        description={t("compare.description")}
        features={[
          t("compare.features.0"),
          t("compare.features.1"),
          t("compare.features.2"),
          t("compare.features.3"),
        ]}
        source="compare"
        ctaText={t("ctaText")}
        loginText={t("loginText")}
        waitlistHeading={t("waitlistHeading")}
        waitlistSubheading={t("waitlistSubheading")}
      />
    );
  }

  return <CompareClient />;
}
