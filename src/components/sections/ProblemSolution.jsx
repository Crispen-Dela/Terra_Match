import { useState, useEffect } from "react";
import gisRiskDataImg from '../../assets/images/gis-risk-data.jpg';
import projectTrackingImg from '../../assets/images/project-tracking.jpg';
import verifiedMatchImg from '../../assets/images/verified-match.jpg';

const STATS = [
  { value: "0", label: "Fraudulent Transactions" },
  { value: "100%", label: "Verified Contractors" },
  { value: "GIS", label: "Powered Risk Data" },
  { value: "Real", label: "Real-Time Bidding Infrastructure" },
];

const PROBLEMS = [
  { text: "Buying land without knowing the risks." },
  { text: "Finding reliable contractors is difficult" },
  { text: "No transparency in pricing and bidding" },
];

const SOLUTIONS = [
  { text: "Insights for safer land decisions." },
  { text: "Verified contractors with proven track records" },
  { text: "Transparent pricing and secure bidding" },
];

const slides = [
  {
    id: 1,
    image: gisRiskDataImg,
    title: "GIS Risk Data",
    data: ["Terrain: Suitable", "Flood Risk: Low", "Drainage: Good", "Soil Quality: High"]
  },
  {
    id: 2,
    image: projectTrackingImg,
    title: "Project Tracking",
    data: ["Status: On Schedule", "Budget: Optimized", "Timeline: Active", "Milestone: Foundation"]
  },
  {
    id: 3,
    image: verifiedMatchImg,
    title: "Verified Match",
    data: ["Name: Kwame Builders", "Rating: 4.9/5", "Success: 98%", "Status: Verified"]
  }
];

export default function ProblemSolution() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full">
      {/* Part 1: Floating Stats Banner */}
      <div className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] py-8 border border-slate-100">
            <div className="grid grid-cols-2 divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-slate-200">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-4xl font-extrabold text-[#064E3B] mb-2">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Problem/Solution & Interactive Mockup Area */}
      <div className="bg-[#eaf4ec] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column (The Comparison) */}
            <div className="space-y-12">
              
              {/* The Problem */}
              <div>
                <h3 className="mb-5 text-2xl font-bold text-slate-900 px-2">
                  The Problem
                </h3>
                <ul className="space-y-2">
                  {PROBLEMS.map((item) => (
                    <li key={item.text} className="flex items-start gap-4 p-3 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-sm cursor-default">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span className="text-[15px] font-medium text-slate-700 leading-snug">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Our Solution */}
              <div>
                <h3 className="mb-5 text-2xl font-bold text-slate-900 px-2">
                  Our Solution
                </h3>
                <ul className="space-y-2">
                  {SOLUTIONS.map((item) => (
                    <li key={item.text} className="flex items-start gap-4 p-3 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-sm cursor-default">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      <span className="text-[15px] font-medium text-slate-700 leading-snug">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Right Column (Map Mockup & Floating GIS Card) */}
            <div className="relative pt-6 pr-6 sm:pt-10 sm:pr-10 lg:pl-10">
              
              {/* Browser Mockup */}
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 aspect-[4/3]">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                
                {/* Auto-sliding Images */}
                <div className="absolute inset-0 pt-10 bg-slate-100">
                  {slides.map((slide, index) => (
                    <img
                      key={slide.id}
                      src={slide.image}
                      alt={slide.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out transform-gpu ${
                        index === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Dynamic Floating Data Widget */}
              <div className="absolute top-1/2 -right-2 sm:-right-6 -translate-y-1/2 w-56 min-h-[250px] rounded-xl bg-white/95 backdrop-blur-md p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-30 transition-all duration-300">
                <div key={activeSlide} className="animate-fadeUp">
                  <p className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                    {slides[activeSlide].title}
                  </p>
                  <div className="space-y-4">
                    {slides[activeSlide].data.map((item, i) => {
                      const [label, value] = item.split(": ");
                      return (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
                          <div className="flex items-center justify-between text-sm font-bold text-[#064E3B]">
                            <span className="truncate pr-2">{value}</span>
                            <svg className="h-3 w-3 text-[#064E3B]/40 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
