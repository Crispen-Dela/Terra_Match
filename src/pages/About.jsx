export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-[#064E3B] py-20 px-6 sm:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Build Smarter. Live Better.
          </h1>
          <p className="mt-6 text-xl leading-8 text-emerald-100 max-w-2xl mx-auto">
            Bringing intelligence, transparency, and trust to land acquisition and construction.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-6 lg:px-8 mt-16 space-y-24">
        
        {/* Section 1: Our Mission */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <h2 className="text-3xl font-bold tracking-tight text-[#064E3B] mb-6 border-b border-slate-100 pb-4">
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            Our mission is to transform how land and construction decisions are made. By integrating spatial intelligence with AI-driven recommendation systems and digital marketplaces, we empower users to make informed, data-driven, and transparent decisions.
          </p>
        </section>

        {/* Section 2: The Challenge We Are Solving */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <h2 className="text-3xl font-bold tracking-tight text-[#064E3B] mb-6 border-b border-slate-100 pb-4">
            The Challenge We Are Solving
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            For too many, land acquisition and construction remain highly challenging. Buyers often purchase land without critical knowledge of environmental conditions like terrain, drainage patterns, and flood risks, leading to poor construction outcomes and financial loss. At the same time, the construction industry lacks a centralized, transparent system for connecting clients with verified contractors, leaving individuals vulnerable to unqualified or fraudulent professionals.
          </p>
        </section>

        {/* Section 3: The TerraMatch Solution */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight text-[#064E3B] mb-10 text-center">
            The TerraMatch Solution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="group rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-slate-100">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#064E3B] mb-4">Spatial Intelligence</h3>
              <p className="text-base leading-relaxed text-slate-600">
                Interactive systems for analyzing land using environmental and spatial data to prevent buying in flood-prone or unsuitable areas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-slate-100">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#064E3B] mb-4">AI-Powered Recommendations</h3>
              <p className="text-base leading-relaxed text-slate-600">
                An intelligent engine that analyzes ratings, reviews, skills, and past performance to suggest the most suitable, verified contractors for your specific project.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-slate-100">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#064E3B] mb-4">Transparent Bidding</h3>
              <p className="text-base leading-relaxed text-slate-600">
                A structured digital marketplace that allows land owners to list properties and receive bids, while helping users compare competitive offers for both land and construction services.
              </p>
            </div>

          </div>
        </section>

        {/* Section 4: Our Commitment */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] text-center border-t-4 border-emerald-500">
          <h2 className="text-3xl font-bold tracking-tight text-[#064E3B] mb-6">
            Our Commitment
          </h2>
          <p className="text-lg leading-relaxed text-slate-600 max-w-3xl mx-auto">
            Whether you are buying your first plot of land, listing a property, or bidding on a new construction project, TerraMatch ensures enhanced safety, economic protection, and fair pricing every step of the way.
          </p>
        </section>

      </div>
    </div>
  );
}
