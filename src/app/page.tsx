import Link from "next/link";
import { getAnalyzedSymbols, getAllReportsByDate } from "@/data/analysis";

const FEATURED_STOCKS = [
  { symbol: "TSLA", name: "Tesla", tag: "EV · Energy", logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/TSLA.png" },
  { symbol: "NVDA", name: "NVIDIA", tag: "AI · GPU", logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/NVDA.png" },
  { symbol: "PLTR", name: "Palantir", tag: "Big Data · AI", logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/PLTR.png" },
  { symbol: "BMNR", name: "Bitmine", tag: "ETH · Mining", logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/950783675656.png" },
];

const PILLARS = [
  { label: "Quality", desc: "수익성과 재무건전성", color: "from-blue-500 to-cyan-400" },
  { label: "Moat", desc: "경쟁우위와 해자", color: "from-violet-500 to-purple-400" },
  { label: "Value", desc: "내재가치 대비 저평가", color: "from-emerald-500 to-green-400" },
  { label: "Growth", desc: "성장성과 잠재력", color: "from-amber-500 to-yellow-400" },
  { label: "Momentum", desc: "기술적 추세와 모멘텀", color: "from-rose-500 to-pink-400" },
];

export default function Home() {
  const symbols = getAnalyzedSymbols();
  const totalReports = getAllReportsByDate().length;

  return (
    <main className="min-h-screen overflow-hidden">
      {/* ─── HERO ─── */}
      <section className="relative isolate">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-tr from-blue-600/30 via-purple-500/20 to-pink-500/20 blur-[120px] dark:from-blue-600/15 dark:via-purple-500/10 dark:to-pink-500/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-zinc-700 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-24 pb-16 sm:pb-24 text-center">

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-4">
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
              데이터로 투자하다
            </span>
          </h1>

          {/* Stats badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium tracking-wide border border-blue-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            {symbols.length}개 종목 · {totalReports}건 분석 완료
          </div>

          <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            월가 방법론을 체계적으로 수치화하여<br className="hidden sm:block" />
            감이 아닌 근거로 투자 판단을 돕습니다
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/analysis"
              className="group relative px-7 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 hover:-translate-y-0.5"
            >
              분석 리포트 보기
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/stock/TSLA"
              className="px-7 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5"
            >
              종목 분석
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5 PILLARS ─── */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
              Investment Framework
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              5가지 분석 축
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PILLARS.map((p) => (
              <div
                key={p.label}
                className="group relative p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
              >
                <div className={`h-1 w-8 mb-3 rounded-full bg-gradient-to-r ${p.color}`} />
                <div className="text-sm font-bold mb-1">{p.label}</div>
                <div className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED STOCKS ─── */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-gray-50/50 dark:via-zinc-900/30 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
                Featured
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">주목 종목</h2>
            </div>
            <Link
              href="/compare?symbols=TSLA,NVDA"
              className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
            >
              비교하기 →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_STOCKS.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="group"
              >
                <div className="relative p-5 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30">
                  <div className="flex items-center justify-between mb-4">
                    <img
                      src={stock.logo}
                      alt={stock.name}
                      className="w-9 h-9 rounded-full object-cover bg-white"
                    />
                    <span className="text-xs text-gray-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      →
                    </span>
                  </div>
                  <div className="text-lg font-bold mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {stock.symbol}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500 mb-2">{stock.name}</div>
                  <div className="inline-block text-[10px] font-medium tracking-wide text-gray-400 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {stock.tag}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── METHODOLOGY ─── */}
      <section className="py-16 sm:py-20 border-t border-gray-200/60 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "정량적 스코어링",
                desc: "수익성, 밸류에이션, 성장률 등 핵심 재무지표를 기반으로 A+~F 등급을 산출합니다.",
                accent: "text-blue-500",
              },
              {
                title: "심층 리서치",
                desc: "출처가 명확한 12개 이상의 소스를 기반으로 매수 근거, 리스크, 경쟁우위를 분석합니다.",
                accent: "text-violet-500",
              },
              {
                title: "일일 트래킹",
                desc: "날짜별 분석 이력을 누적하여 시간에 따른 변화를 추적하고 투자 판단에 활용합니다.",
                accent: "text-emerald-500",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className={`text-sm font-bold ${item.accent} mb-2`}>{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 text-center text-xs text-gray-400 dark:text-zinc-600">
        <span className="font-medium">Thistory</span> · 투자 권유가 아닌 정보 제공 목적입니다
      </footer>
    </main>
  );
}
