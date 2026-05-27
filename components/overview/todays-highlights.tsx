'use client';

/* Mobile-only "Today's Highlights" card with dark gradient background */
export function TodaysHighlights() {
  return (
    <div>
      <div
        className="rounded-2xl px-4 py-5 relative overflow-hidden sm:px-5"
        style={{
          background: 'linear-gradient(135deg, #1e2a4a 0%, #3b2d6b 50%, #4f3d8a 100%)',
        }}
      >
        {/* Background decoration circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />

        <h3 className="text-[15px] font-bold text-white mb-3 relative z-10">
          Today&apos;s Highlights
        </h3>

        <div className="grid grid-cols-1 gap-3 relative z-10 sm:grid-cols-2">
          {/* Highlight 1 */}
          <div className="min-w-0 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-[#4f6ef7]/30 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <span className="text-[13px] font-bold text-white leading-tight">
                Ticket volume is up
              </span>
            </div>
            <p className="text-[11px] text-slate-300/80 leading-relaxed">
              +24% compared to<br />last Wednesday
            </p>
          </div>

          {/* Highlight 2 */}
          <div className="min-w-0 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="text-[13px] font-bold text-white leading-tight">
                Live Chat topics
              </span>
            </div>
            <p className="text-[11px] text-slate-300/80 leading-relaxed">
              spiked around<br />2–4 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
