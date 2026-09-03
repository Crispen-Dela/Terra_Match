const STATS = [
  { value: "1,500+", label: "Verified Contractors" },
  { value: "2,300+", label: "Land Listings" },
  { value: "4.8/5", label: "Average User Ratings" },
  { value: "98%", label: "Project Success Rate" },
];

export default function StatsRow() {
  return (
    <section className="bg-slate-50 pb-16 sm:pb-24">
      <div className="container-page max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:divide-x sm:divide-slate-200">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center px-4">
              <p className="text-3xl font-extrabold text-emerald-900 tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
