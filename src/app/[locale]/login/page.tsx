import { auth } from "@/auth";
import { loginWithGoogle } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const session = await auth();
  const { locale } = await params;
  const { callbackUrl } = await searchParams;

  // Validate callbackUrl to prevent open redirect
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : `/${locale}`;

  if (session) {
    redirect(safeCallbackUrl);
  }

  const t = await getTranslations({ locale, namespace: "auth" });

  async function handleGoogleLogin() {
    "use server";
    await loginWithGoogle(safeCallbackUrl);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white text-2xl font-bold mb-4">
              I
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
              {t("description")}
            </p>
          </div>

          {/* Google Login */}
          <form action={handleGoogleLogin}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("googleLogin")}
            </button>
          </form>

          {/* Info */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-zinc-500">
            {t("loginInfo")}
          </p>
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-zinc-500">
            <Link href={`/${locale}/terms`} className="underline hover:text-gray-600 dark:hover:text-zinc-300">
              {t("termsLink")}
            </Link>
            {" · "}
            <Link href={`/${locale}/privacy`} className="underline hover:text-gray-600 dark:hover:text-zinc-300">
              {t("privacyLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
