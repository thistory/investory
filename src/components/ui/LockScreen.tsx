import { Link } from "@/i18n/navigation";
import WaitlistForm from "./WaitlistForm";

interface LockScreenProps {
  locale: string;
  title: string;
  description: string;
  features: string[];
  source: string;
  ctaText: string;
  waitlistHeading: string;
  waitlistSubheading: string;
  loginText: string;
}

export default function LockScreen({
  locale,
  title,
  description,
  features,
  source,
  ctaText,
  waitlistHeading,
  waitlistSubheading,
  loginText,
}: LockScreenProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Lock Icon with glow */}
        <div className="relative mx-auto w-20 h-20 mb-8">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
        <p className="text-lg text-gray-500 dark:text-zinc-400 mb-8 max-w-lg mx-auto">{description}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 max-w-lg mx-auto text-left">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800">
              <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-zinc-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* Waitlist Section */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{waitlistHeading}</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">{waitlistSubheading}</p>
          <WaitlistForm source={source} locale={locale} />
        </div>

        {/* Login CTA */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-gray-400 dark:text-zinc-500 text-sm">{ctaText}</span>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-white font-medium transition-all border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loginText}
          </Link>
        </div>
      </div>
    </div>
  );
}
