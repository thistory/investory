import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requirePageAuth(locale: string) {
  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }
  return session;
}

export async function requirePageSubscription(locale: string) {
  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  if (session.user.plan !== "pro") {
    redirect(`/${locale}/pricing`);
  }

  return session;
}
