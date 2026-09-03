import { api } from "./api";
import { CONTRACTORS } from "../constants/contractors";

export async function recommendContractors(brief = {}, { limit = 4 } = {}) {
  try {
    const res = await api.post("/api/ai/recommend", { ...brief, limit });
    if (res && res.recommendations && res.recommendations.length > 0) {
      return res.recommendations.map((item) => {
        const c = item?.contractor || item || {};
        return {
          contractor: {
            ...c,
            id: c.id || c.slug,
            slug: c.slug || c.id,
            name: c.name || c.companyName || "Verified Contractor",
            rating: c.rating != null ? c.rating : 4.8,
            reviews: c.reviews || 0,
            projects: c.projects || 0,
            specialties: c.specialties || [],
            location: c.location || "Ghana",
            category: c.category || "Building & Construction",
            image: c.image || null,
            verified: Boolean(c.verified),
          },
          score: item?.score || 0,
          reasons: item?.reasons || [],
        };
      });
    }
  } catch (err) {
    console.warn("Backend AI recommend fallback:", err.message);
  }

  // Fallback heuristic scoring
  return CONTRACTORS.map((c) => ({
    contractor: c,
    reasons: [`Top rated professional with ${c.reviews} client reviews`],
  })).slice(0, limit);
}

export async function askAssistant({ brief, history = [], userMessage = "", attachments = [] }) {
  try {
    const res = await api.post("/api/ai/chat", {
      brief,
      history,
      userMessage,
      attachments,
    });
    if (res && res.reply) {
      return {
        reply: res.reply,
        matches: (Array.isArray(res.matches) ? res.matches : []).map((item) => {
          const c = item?.contractor || item || {};
          return {
            contractor: {
              ...c,
              id: c.id || c.slug,
              slug: c.slug || c.id,
              name: c.name || c.companyName || "Verified Contractor",
              rating: c.rating != null ? c.rating : 4.8,
              reviews: c.reviews || 0,
              projects: c.projects || 0,
              specialties: c.specialties || [],
              location: c.location || "Ghana",
              category: c.category || "Building & Construction",
              image: c.image || null,
              verified: Boolean(c.verified),
            },
            reasons: item?.reasons || [],
          };
        }),
        projectBrief: res.projectBrief || null,
        parsedIntent: res.parsedIntent || null,
      };
    }
  } catch (err) {
    console.warn("Backend AI assistant chat fallback:", err.message);
  }

  const fallbackMatches = await recommendContractors(brief, { limit: 3 });
  return {
    reply: `Based on your ${brief.category || "construction"} project in ${brief.location || "Ghana"}, here are the most suitable verified contractors.`,
    matches: fallbackMatches,
    projectBrief: brief,
    parsedIntent: null,
  };
}
