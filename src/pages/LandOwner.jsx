import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LandOwnerProfile from "../components/sections/LandOwnerProfile";
import { LAND_OWNERS } from "../constants/landOwners";
import { landApi } from "../services/landApi";
import { subscribeToBidEvents } from "../services/bidEvents";

export default function LandOwner() {
  const { slug } = useParams();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback((showLoading = true) => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setError(null);

    landApi
      .getOwnerProfile(slug)
      .then((data) => {
        if (data && data.name) {
          setOwner(data);
        } else if (LAND_OWNERS[slug]) {
          setOwner(LAND_OWNERS[slug]);
        } else {
          setOwner(null);
        }
      })
      .catch((err) => {
        console.warn("Backend owner lookup fallback:", err.message);
        if (LAND_OWNERS[slug]) {
          setOwner(LAND_OWNERS[slug]);
        }
      })
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    fetchProfile(true);
  }, [fetchProfile]);

  // Real-time listener for live updates when lands are marked sold or deleted
  useEffect(() => {
    const unsubscribe = subscribeToBidEvents({
      onEvent: (event) => {
        if (
          event?.type === "LAND_STATUS_CHANGED" ||
          event?.type === "LAND_DELETED" ||
          event?.type === "BID_STATUS_CHANGED"
        ) {
          fetchProfile(false);
        }
      },
    });
    return () => unsubscribe();
  }, [fetchProfile]);


  if (loading) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-600 border-t-transparent" />
        <p className="mt-4 text-sm text-ink-500">Loading seller profile...</p>
      </section>
    );
  }

  if (!owner) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="rounded-full bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-700">
          Not found
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
          Profile Not Found
        </h1>
        <p className="mt-3 max-w-md text-ink-700">
          We couldn't find a land owner profile at this address. It may
          have been removed, or the link might be incorrect.
        </p>
        <Button as={Link} to="/explore-land" variant="primary" className="mt-8">
          Back to Explore Land
        </Button>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <LandOwnerProfile owner={owner} slug={slug} />
    </ErrorBoundary>
  );
}
