import StarRating from "../common/StarRating";
import kwameBuilderImg from "../../assets/images/kwame_builder.jpg";

const REASONS = [
  "High success rate in similar projects",
  "Best price performance score",
  "Top rated by 95% of clients",
  "Available for project timeline",
];

export default function AIRecommendation() {
  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center sm:text-left mb-10">
          <h2 className="text-3xl font-extrabold text-emerald-900 sm:text-4xl tracking-tight">
            AI Recommendation
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Based on your project parameters in <span className="font-semibold text-emerald-900">East Legon Hills</span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 items-stretch">
          
          {/* Left Side: Premium Contractor Card */}
          <div className="lg:col-span-2 group">
            <div className="h-full flex flex-col justify-center rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center items-center border border-slate-100">
              <div className="h-20 w-20 rounded-full border border-slate-200 p-1 overflow-hidden">
                <img 
                  src={kwameBuilderImg} 
                  alt="Kwame Builders Ltd." 
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-emerald-600">
                Top Match
              </p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-900">
                Kwame Builders Ltd.
              </h3>
              
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <StarRating value={4.9} className="scale-90 origin-center text-amber-400" starClassName="fill-amber-400" />
                  <span className="text-sm font-bold text-emerald-900">4.9</span>
                  <span className="text-xs font-medium text-slate-500">(128 reviews)</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Verified Identity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Why we recommend them */}
          <div className="lg:col-span-3 group">
            <div className="h-full flex flex-col justify-center rounded-2xl bg-white p-8 sm:p-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 mb-6 border-b border-slate-100 pb-3">
                Match Analysis Reasoning
              </h3>
              <ul className="space-y-5">
                {REASONS.map((reason) => (
                  <li key={reason} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-base font-medium text-slate-600">
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
