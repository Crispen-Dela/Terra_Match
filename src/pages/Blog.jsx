import { Link } from "react-router-dom";

const BLOG_POSTS = [
  {
    id: 1,
    title: "The Hidden Risks of Buying Land: Why Environmental Data Matters",
    excerpt: "Discover how spatial data and AI can reveal flood risks and drainage patterns before you finalize your land purchase.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
    slug: "hidden-risks-of-buying-land"
  },
  {
    id: 2,
    title: "How AI is Changing the Way We Hire Construction Contractors",
    excerpt: "Stop relying on informal recommendations. Learn how verified credentials and AI matching secure your construction projects.",
    image: "https://images.unsplash.com/photo-1541888081691-81cb0272cbb0?w=600&auto=format&fit=crop&q=80",
    slug: "ai-changing-contractor-hiring"
  },
  {
    id: 3,
    title: "Fair Pricing in Real Estate: The Power of Transparent Bidding",
    excerpt: "Explore how structured digital marketplaces organize competitive offers, giving both buyers and sellers a fairer environment.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80",
    slug: "power-of-transparent-bidding"
  }
];

export default function Blog() {
  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Section */}
      <section className="bg-white py-20 px-6 lg:px-8 border-b border-slate-200">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#064E3B] sm:text-5xl">
            TerraMatch Insights
          </h1>
          <p className="mt-4 text-xl leading-8 text-slate-600">
            News, guides, and updates on smart construction and land acquisition.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article 
              key={post.id} 
              className="flex flex-col rounded-2xl bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-slate-100 overflow-hidden"
            >
              {/* Image Container */}
              <div className="h-56 w-full overflow-hidden bg-slate-200">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                />
              </div>
              
              {/* Content Container */}
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-[#064E3B] leading-tight mb-4">
                  {post.title}
                </h2>
                <p className="text-base leading-relaxed text-slate-600 flex-1">
                  {post.excerpt}
                </p>
                <div className="mt-8">
                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="inline-flex items-center font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Read More
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
