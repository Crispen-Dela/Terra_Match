import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContractorCard from "../common/ContractorCard";
import { contractorApi } from "../../services/contractorApi";

const INITIAL_VISIBLE = 4;
const REVEAL_STEP = 4;

/**
 * Renders the "Top Rated Contractors" grid loaded directly from the database.
 * Used on:
 *  - Home ("/")           -> fetches live contractors from API
 *  - Find Contractor page -> live-filtered list passed in via `contractors`
 */
export default function TopContractors({
  title = "Top Rated Contractors",
  subtitle,
  reviewsLabel = "",
  contractors,
  sectionId,
  onViewAll,
}) {
  const [internalList, setInternalList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    if (!contractors) {
      contractorApi
        .list()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setInternalList(data);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch contractors from backend:", err.message);
        });
    }
  }, [contractors]);

  const activeContractors = contractors || internalList;
  const visibleContractors = activeContractors.slice(0, visibleCount);
  const hasMore = activeContractors.length > visibleCount;

  return (
    <section id={sectionId} className="bg-white py-16 sm:py-20">
      <div className="container-page">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-ink-700">{subtitle}</p>
            )}
          </div>
          {onViewAll ? (
            <button
              type="button"
              onClick={() => {
                setVisibleCount(activeContractors.length || 50);
                onViewAll();
              }}
              className="mt-1 flex shrink-0 items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-700"
            >
              View All ({activeContractors.length}) <span aria-hidden="true">&rsaquo;</span>
            </button>
          ) : (
            <Link
              to="/find-contractor"
              className="mt-1 flex shrink-0 items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-700"
            >
              View All <span aria-hidden="true">&rsaquo;</span>
            </Link>
          )}
        </div>

        {activeContractors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-900/15 bg-mist-50 px-6 py-10 text-center text-sm text-ink-700">
            No contractors match your filters. Try clearing a filter or
            searching a different keyword.
          </p>
        ) : (
          <div className="relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleContractors.map((c) => (
                <ContractorCard
                  key={c.id || c.slug}
                  contractor={c}
                  reviewsLabel={reviewsLabel}
                />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + REVEAL_STEP)}
                aria-label="Show more contractors"
                className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-900/10 bg-white text-ink-700 shadow-card hover:bg-mist-100 lg:flex"
              >
                <span aria-hidden="true">&rsaquo;</span>
              </button>
            )}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center lg:hidden">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + REVEAL_STEP)}
              className="text-sm font-semibold text-forest-600 hover:text-forest-700"
            >
              Show more contractors
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
