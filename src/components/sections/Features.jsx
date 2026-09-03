import SectionHeading from "../common/SectionHeading";
import { BrainIcon, ScaleIcon } from "../common/Icons";

const FEATURES = [
  {
    icon: BrainIcon,
    title: "AI Contractor Recommendation",
    description:
      "Smart suggestions based on ratings, project success, and user reviews.",
  },
  {
    icon: ScaleIcon,
    title: "Transparent Land Bidding",
    description: "Bid, compare and choose the best offers with full transparency.",
  },
];

export default function Features() {
  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading className="[&_h2]:text-emerald-900 [&_div]:bg-emerald-600">
          Powerful Features for Smarter Decisions
        </SectionHeading>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8 max-w-5xl mx-auto">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col items-start rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-10"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
                aria-hidden="true"
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-emerald-900 sm:text-2xl">
                {feature.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
