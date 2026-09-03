export default function PlaceholderTab({ title, description }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center animate-in fade-in duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 mb-6">
        <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-200">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {description || "This module is currently under development. Backend API integration is required before this data can be visualized."}
      </p>
    </div>
  );
}
