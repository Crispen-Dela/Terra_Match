import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import StarRating from "../common/StarRating";

function MatchCard({ position, matchLabel, people }) {
  return (
    <div
      className={`absolute w-[220px] rounded-xl bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-floatY border border-slate-100 z-10 ${position}`}
    >
      <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
        Contractor Match:{" "}
        <span className="text-emerald-600">{matchLabel}</span>
      </p>
      <div className="space-y-4">
        {people.map((person) => (
          <div key={person.name} className="flex items-start gap-3">
            <img 
              src={person.avatar} 
              alt={person.name} 
              className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm bg-slate-200" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-center">
                <p className="truncate text-xs font-bold text-slate-900">
                  {person.name}
                </p>
                {person.tag && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{person.tag}</span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <StarRating value={person.stars} className="scale-75 origin-left text-amber-400" starClassName="fill-amber-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
      <div className="animate-fadeUp">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
          Empowering Smarter Construction
        </Badge>

        <h1 className="mt-6 text-5xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-6xl">
          Secure Your Land.
          <br />
          Match Your Contractor.
          <br />
          Powered by AI.
        </h1>

        <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-slate-600">
          A unified platform combining GIS spatial analysis, data-driven land
          bidding, and verified AI contractor matching to mitigate
          construction risks and eliminate fraud.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link 
            to="/explore-land" 
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-emerald-700 hover:shadow-lg"
          >
            Explore Interactive Map
          </Link>
          <Link 
            to="/find-contractor" 
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-7 py-3.5 text-base font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-blue-800 hover:shadow-lg"
          >
            Find Verified Contractors
          </Link>
        </div>
      </div>

      {/* Hero visual: browser-chrome frame around topographic map */}
      <div className="relative animate-fadeUp [animation-delay:150ms] pt-10">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Browser Top Bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex gap-1.5 text-slate-400 text-lg font-bold ml-2">
              <span aria-hidden="true">‹</span>
              <span aria-hidden="true">›</span>
            </div>
            <div className="h-5 flex-1 rounded-md bg-slate-200/60 ml-2" />
          </div>

          {/* Topographic Map Image */}
          <div className="relative bg-white w-full flex justify-center p-4">
            <img 
              src="/assets/topographic-map.png" 
              alt="3D Isometric Topographic Map" 
              className="w-full max-w-lg object-contain"
            />
          </div>
        </div>

        {/* Floating UI Cards */}
        <MatchCard
          position="-top-4 -right-4 sm:-right-8"
          matchLabel="98%"
          people={[
            { 
              name: "Benjamin A", 
              stars: 5, 
              tag: "Skills ↓", 
              avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60" 
            },
            { 
              name: "John Brown", 
              stars: 5, 
              tag: "Ratings", 
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60" 
            },
          ]}
        />
        <MatchCard
          position="bottom-8 -right-4 sm:-right-8 [animation-delay:1.5s]"
          matchLabel="98%"
          people={[
            { 
              name: "Manfred Cruz", 
              stars: 4, 
              tag: "Ratings ↓", 
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" 
            },
            { 
              name: "Ralp Thompson", 
              stars: 4, 
              tag: "", 
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" 
            },
          ]}
        />
      </div>
    </section>
  );
}
