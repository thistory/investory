"use client";

import { useProfile } from "@/lib/hooks/useProfile";

interface CompanyDescriptionProps {
  symbol: string;
}

export function CompanyDescription({ symbol }: CompanyDescriptionProps) {
  const { data: profile, isLoading } = useProfile(symbol);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg animate-pulse">
        <div className="h-6 w-32 bg-gray-100 dark:bg-zinc-800 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-3 sm:mb-4">기업 개요</h2>
      {profile?.description ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
          {profile.description}
        </p>
      ) : (
        <p className="text-sm text-gray-400 dark:text-zinc-500">기업 설명을 불러올 수 없습니다.</p>
      )}

      {/* Additional company info */}
      {(profile?.website || profile?.cik) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 text-sm">
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              공식 웹사이트 →
            </a>
          )}
          {profile?.cik && (
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}&type=10-K&dateb=&owner=include&count=40`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              SEC 공시 보기 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
