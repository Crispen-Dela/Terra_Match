import prisma from "../config/prisma.js";
import { formatContractorResponse } from "./contractorController.js";
import { GoogleGenAI } from "@google/genai";

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const BUDGET_RATING_FLOOR = {
  "Under GHS 10,000": 0,
  "GHS 10,000 – 30,000": 4.5,
  "GHS 30,000 – 75,000": 4.6,
  "GHS 75,000 – 150,000": 4.7,
  "GHS 150,000 – 300,000": 4.8,
  "Above GHS 300,000": 4.8,
};

// Ghanaian Construction & Trades Synonym Dictionary for Semantic Matching
const CATEGORY_KEYWORDS = {
  "Building & Construction": [
    "building", "house", "construction", "masonry", "block", "concrete", "foundation",
    "brick", "structure", "storey", "compound", "contractor", "builder", "3-bedroom",
    "4-bedroom", "2-bedroom", "duplex", "mansion", "commercial building", "lintel", "decking"
  ],
  "Plumbing & Piping": [
    "plumbing", "plumber", "pipe", "piping", "borehole", "water", "tank", "polytank",
    "drainage", "sewage", "sewer", "gutter", "water heater", "biogas", "soakaway",
    "tap", "sink", "bathroom", "toilet", "pump", "plumbing fixture"
  ],
  "Electrical & Solar": [
    "electrical", "electrician", "solar", "inverter", "battery", "panel", "wiring",
    "conduit", "generator", "power", "lighting", "cctv", "security camera",
    "electric fence", "earthing", "breaker", "meter", "smart home", "transformer"
  ],
  "Renovation & Remodeling": [
    "renovation", "remodel", "upgrade", "facelift", "roof repair", "restoration",
    "crack repair", "expansion", "addition", "rehabilitation", "refurbishment"
  ],
  "Civil & Structural Engineering": [
    "civil", "structural", "engineer", "retaining wall", "bridge", "culvert",
    "drain", "road", "pavement", "soil test", "concrete testing", "surveyor",
    "cadastral", "topographical", "geotechnical", "column", "beam"
  ],
  "Interior Design & Finishing": [
    "interior", "finishing", "tiling", "tiles", "pop", "plaster of paris", "ceiling",
    "painting", "painter", "doors", "windows", "aluminum", "glass", "cabinet",
    "wardrobe", "kitchen", "drywall", "lighting fixture"
  ],
  "Landscaping & Earthworks": [
    "landscaping", "earthworks", "grading", "excavation", "clearing", "paving",
    "pavement blocks", "grass", "garden", "turf", "retaining", "filling", "laterite",
    "perimeter wall", "gate"
  ],
  "Architectural Services": [
    "architect", "architecture", "plan", "drawing", "3d design", "render",
    "blueprint", "building permit", "cad", "floor plan", "elevation drawing",
    "spatial design"
  ],
};

function inferCategoryFromQuery(query = "") {
  const q = query.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) {
      return category;
    }
  }
  return null;
}

function scoreContractor(contractor, brief = {}) {
  let score = 0;
  const reasons = [];

  const targetCategory = brief.category || inferCategoryFromQuery(brief.description || brief.title || "");

  // 1. Category and Semantic Specialty Matching
  if (targetCategory && targetCategory !== "All Categories" && contractor.category) {
    const isDirectMatch =
      contractor.category.toLowerCase().includes(targetCategory.toLowerCase()) ||
      targetCategory.toLowerCase().includes(contractor.category.toLowerCase());

    const contractorKeywords = CATEGORY_KEYWORDS[contractor.category] || [];
    const hasSemanticOverlap = contractorKeywords.some((kw) =>
      (brief.description || brief.title || brief.category || "").toLowerCase().includes(kw)
    );

    if (isDirectMatch) {
      score += 40;
      reasons.push(`Specializes directly in ${contractor.category}`);
    } else if (hasSemanticOverlap) {
      score += 30;
      reasons.push(`Experienced in requirements matching ${contractor.category}`);
    }
  }

  // 2. Specialty matching in contractor specialties list
  if (Array.isArray(contractor.specialties) && contractor.specialties.length > 0) {
    const briefText = `${brief.title || ""} ${brief.description || ""} ${brief.category || ""}`.toLowerCase();
    const matchedSpecialty = contractor.specialties.find((s) => briefText.includes(s.toLowerCase()));
    if (matchedSpecialty) {
      score += 15;
      reasons.push(`Specific expertise in ${matchedSpecialty}`);
    }
  }

  // 3. Location matching across Ghana regions & towns
  if (brief.location && contractor.location) {
    const briefLoc = brief.location.toLowerCase();
    const contLoc = contractor.location.toLowerCase();
    const briefCity = briefLoc.split(",")[0].trim();
    const contCity = contLoc.split(",")[0].trim();

    if (contLoc.includes(briefCity) || briefLoc.includes(contCity)) {
      score += 25;
      reasons.push(`Based locally near ${contractor.location.split(",")[0]}`);
    } else if (
      (briefLoc.includes("accra") && contLoc.includes("accra")) ||
      (briefLoc.includes("kumasi") && contLoc.includes("kumasi")) ||
      (briefLoc.includes("takoradi") && contLoc.includes("takoradi"))
    ) {
      score += 15;
      reasons.push(`Operates across ${contractor.location}`);
    }
  }

  // 4. Rating and Bayesian credibility score
  const ratingFloor = BUDGET_RATING_FLOOR[brief.budgetRange] ?? 0;
  if (contractor.rating >= ratingFloor && contractor.rating > 0) {
    score += 15;
  }
  if (contractor.rating >= 4.8) {
    score += 10;
    reasons.push(`Top rated at ${contractor.rating}★ (${contractor.reviews || 0} verified client reviews)`);
  } else if (contractor.rating >= 4.5) {
    score += 5;
    reasons.push(`High satisfaction rating of ${contractor.rating}★`);
  }

  // 5. Completed projects track record
  if (contractor.projects >= 20) {
    score += 10;
    reasons.push(`${contractor.projects} verified projects delivered across Ghana`);
  } else if (contractor.projects >= 5) {
    score += 5;
    reasons.push(`${contractor.projects} projects completed on platform`);
  }

  // 6. Verified Ghana Card & License Badge bonus
  if (contractor.verified) {
    score += 15;
    reasons.push("Ghana Card & License Verified Professional");
  }

  return {
    score,
    reasons: reasons.length ? reasons : ["Verified professional with proven track record on TerraMatch"],
  };
}

const FALLBACK_CONTRACTORS = [
  {
    id: "cont-1",
    slug: "kwame-builders",
    name: "Kwame Builders Ltd.",
    companyName: "Kwame Builders Ltd.",
    category: "Building & Construction",
    specialties: ["Residential", "Commercial", "Foundations", "Multi-Storey"],
    location: "East Legon, Accra, Greater Accra",
    rating: 4.9,
    reviews: 128,
    projects: 32,
    verified: true,
  },
  {
    id: "cont-2",
    slug: "volta-civil-engineering",
    name: "Volta Civil & Structural Ltd.",
    companyName: "Volta Civil & Structural Ltd.",
    category: "Civil & Structural Engineering",
    specialties: ["Structural Engineering", "Soil Testing", "Retaining Walls", "Culverts"],
    location: "Airport Residential, Accra, Greater Accra",
    rating: 4.8,
    reviews: 84,
    projects: 24,
    verified: true,
  },
  {
    id: "cont-3",
    slug: "accra-solar-electricals",
    name: "Accra Solar & Electrical Pro",
    companyName: "Accra Solar & Electrical Pro",
    category: "Electrical & Solar",
    specialties: ["Solar Power", "Inverters", "Commercial Wiring", "Earthing & Protection"],
    location: "Spintex, Accra, Greater Accra",
    rating: 4.85,
    reviews: 95,
    projects: 40,
    verified: true,
  },
  {
    id: "cont-4",
    slug: "prime-plumbing-gh",
    name: "Prime Plumbing & Borehole Systems",
    companyName: "Prime Plumbing & Borehole Systems",
    category: "Plumbing & Piping",
    specialties: ["Borehole Drilling", "Water Tanks", "Biofil Digesters", "Sanitary Piping"],
    location: "Haatso, Accra, Greater Accra",
    rating: 4.75,
    reviews: 62,
    projects: 29,
    verified: true,
  },
  {
    id: "cont-5",
    slug: "ashanti-earthworks-landscaping",
    name: "Ashanti Earthworks & Landscaping",
    companyName: "Ashanti Earthworks & Landscaping",
    category: "Landscaping & Earthworks",
    specialties: ["Site Excavation", "Grading & Levelling", "Pavement Blocks", "Perimeter Wall"],
    location: "Ahodwo, Kumasi, Ashanti Region",
    rating: 4.8,
    reviews: 71,
    projects: 22,
    verified: true,
  },
  {
    id: "cont-6",
    slug: "accra-architects-studio",
    name: "Accra Architectural Design Studio",
    companyName: "Accra Architectural Design Studio",
    category: "Architectural Services",
    specialties: ["Architectural Plans", "3D Renders", "Building Permits", "Structural Drawings"],
    location: "Cantonments, Accra, Greater Accra",
    rating: 4.9,
    reviews: 110,
    projects: 45,
    verified: true,
  },
];

async function getContractorsFromDbOrFallback() {
  try {
    const profiles = await prisma.contractorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ghanaCardVerified: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (profiles && profiles.length > 0) {
      return profiles.map(formatContractorResponse);
    }
  } catch (dbErr) {
    console.warn("Database contractor fetch unavailable, using verified offline pool:", dbErr?.message || dbErr);
  }
  return FALLBACK_CONTRACTORS;
}

export async function recommendContractors(req, res, next) {
  try {
    const { category, location, budgetRange, timeline, skills, limit = 4 } = {
      ...req.query,
      ...req.body,
    };

    const brief = { category, location, budgetRange, timeline, skills };
    const formatted = await getContractorsFromDbOrFallback();

    const scored = formatted
      .map((contractor) => {
        const { score, reasons } = scoreContractor(contractor, brief);
        return {
          contractor,
          score,
          reasons,
          matchScore: Math.min(99, Math.max(70, score + Math.round((contractor.rating || 4.5) * 5))),
        };
      })
      .sort((a, b) => b.score - a.score || (b.contractor.rating || 0) - (a.contractor.rating || 0));

    const topMatches = scored.slice(0, parseInt(limit));

    res.json({
      brief,
      totalEvaluated: formatted.length,
      recommendations: topMatches,
    });
  } catch (error) {
    next(error);
  }
}

export async function aiChatAssistant(req, res, next) {
  try {
    const { brief = {}, history = [], userMessage = "", attachments = [] } = req.body;

    // Build structured context
    const inferredCategory = inferCategoryFromQuery(userMessage);
    const effectiveBrief = { ...brief };
    if (inferredCategory && !effectiveBrief.category) {
      effectiveBrief.category = inferredCategory;
    }

    const systemInstruction = `You are TerraBot, the intelligent AI advisor for TerraMatch — Ghana's premier Land, Construction & Verified Contractor platform.

YOUR CAPABILITIES:
1. Land Due Diligence: Explain Ghana land titles, Lands Commission searches, Indentures, Site Plans, Barcoded Cadastral Plans, Leasehold (usually 99 years for Ghanaians, 50 years for foreign nationals) vs Stool/Family Lands, Land Title Certificate (Land Title Registration Act / Land Act 2020), and escrow security.
2. Environmental & Flood Assessment: Provide localized flood risk insights (e.g. low-lying areas like Alajo, Weija vs high-ground rocky zones like East Legon Hills, Haatso, Aburi Ridge), soil suitability, and foundation recommendations.
3. Construction Cost & Planning: Give estimated Ghana construction costs per square meter or room type (in GHS), building permit requirements through District/Municipal Assemblies (MMDAs), and architectural stages.
4. Project Intake: Extract structured details for posting construction projects.
5. Multimodal Document Analysis: If images, site plans, or land documents are attached, examine them for authenticity indicators, surveyor stamps, cadastral coordinates, boundary clarity, and potential dispute risks.

PROJECT INTAKE FIELDS TO SCAN FOR:
- Title (e.g., "3-Bedroom Contemporary House in East Legon Hills")
- Category (One of: "Building & Construction", "Renovation & Remodeling", "Civil & Structural Engineering", "Electrical & Solar", "Plumbing & Piping", "Interior Design & Finishing", "Landscaping & Earthworks", "Architectural Services")
- Description / Scope of work
- Location in Ghana (e.g., East Legon, Haatso, Tema, Kumasi Ahodwo, Cape Coast)
- Budget Range: "Under GHS 10,000", "GHS 10,000 – 30,000", "GHS 30,000 – 75,000", "GHS 75,000 – 150,000", "GHS 150,000 – 300,000", "Above GHS 300,000"
- Timeline: "As soon as possible", "Within 1 month", "1 – 3 months", "3 – 6 months", "6+ months", "Flexible"

GUIDELINES:
- Always be helpful, authoritative, friendly, and culturally nuanced for Ghana.
- Format responses in clean, easy-to-read markdown with bullet points and bold highlights.
- GREETINGS: If the user simply says "hello", "hi", or casual greetings, respond warmly, conversationally, and concisely in 1-2 sentences. Do NOT output a wall of text, do NOT set searchCriteria.contractorSpecialty, and set projectBrief to null.
- CONTRACTOR RECOMMENDATIONS: When the user asks for contractors, builders, or recommendations, introduce the recommendations clearly (e.g., "These are some contractors who can aid you" or "Here are some recommendations"). Only set "searchCriteria.contractorSpecialty" if the user is explicitly asking to find/hire contractors or specifies a clear construction trade need.
- Do NOT generate HTML, SVG, or raw code unless requested.

JSON INTENT & BRIEF OUTPUT:
Always include a clean JSON code block at the very end of your response formatted exactly like this whenever project details, search criteria, interactive widgets, or brief updates are present:
\`\`\`json
{
  "projectBrief": {
    "title": "string or null",
    "category": "string or null",
    "description": "string or null",
    "location": "string or null",
    "budgetRange": "string or null",
    "timeline": "string or null"
  },
  "interactiveWidget": "cost_estimator" | "due_diligence" | "soil_flood" | null,
  "readyToPost": true or false,
  "searchCriteria": {
    "contractorSpecialty": "string or null"
  },
  "quickReplies": ["string", "string", "string"]
}
\`\`\``;

    let responseText = "";
    let parsedJson = null;
    let replyMarkdown = "";

    if (ai) {
      try {
        // Build contents array supporting text and multimodal inline images
        const contents = [];

        // Add history turns if present
        if (Array.isArray(history) && history.length > 0) {
          for (const item of history) {
            const role = item.sender === "me" || item.sender === "user" ? "user" : "model";
            contents.push({
              role,
              parts: [{ text: item.text || item.content || "" }],
            });
          }
        }

        // Current turn parts
        const currentParts = [];
        let promptWithBrief = userMessage || "Hello, please provide guidance on land and construction in Ghana.";
        if (Object.keys(effectiveBrief).length > 0) {
          promptWithBrief = `[Current Project Brief State: ${JSON.stringify(effectiveBrief)}]\n\n${promptWithBrief}`;
        }
        currentParts.push({ text: promptWithBrief });

        // Add attachment image parts if provided
        if (Array.isArray(attachments) && attachments.length > 0) {
          for (const att of attachments) {
            if (att.base64 && att.mimeType) {
              currentParts.push({
                inlineData: {
                  data: att.base64.replace(/^data:image\/\w+;base64,/, ""),
                  mimeType: att.mimeType,
                },
              });
            }
          }
        }

        contents.push({
          role: "user",
          parts: currentParts,
        });

        // Generate content trying latest available Gemini models
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
        for (const model of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });
            if (response?.text) {
              responseText = response.text;
              break;
            }
          } catch (mErr) {
            // continue to fallback model
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, using intelligent fallback:", geminiError?.message || geminiError);
      }
    }

    const qTrimmed = userMessage.trim().toLowerCase();
    const isGreeting = /^(hello|hi|hey|good morning|good afternoon|good evening|greetings|howdy|yo|sup|help)\b/i.test(qTrimmed) || qTrimmed === "hello" || qTrimmed === "hi" || qTrimmed === "hey";
    const isGenericPleasantry = /^(good|great|thanks|thank you|ok|okay|nice|awesome|cool|alright|perfect|sounds good|noted|understood|well done|good job|fine)\b/i.test(qTrimmed) || ["good", "great", "thanks", "thank you", "ok", "okay", "nice", "awesome", "cool", "alright", "perfect", "fine", "yes", "no"].includes(qTrimmed);
    const isGreetingOrPleasantry = isGreeting || isGenericPleasantry;

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Heuristic intelligent fallback if Gemini is not configured or failed
    if (!responseText) {
      const qLower = qTrimmed;
      let fallbackReply = "";
      let quickReplies = ["Estimate Construction Cost", "Check Land Due Diligence", "Inspect Flood Risk", "Find Top Contractors"];
      let fallbackWidget = null;

      if (isGreeting) {
        const greetingOptions = [
          `Hello! 👋 I am the TerraMatch AI Assistant here to help you with land acquisition, due diligence, and verified construction in Ghana.\n\nHow can I assist you today?`,
          `Hi there! 👋 Welcome to TerraMatch. I am here to help you calculate construction costs, verify land documents, or match with trusted builders across Ghana. What can I help you with today?`,
          `Hello! 👋 I am glad to help with all your Ghanaian real estate and construction needs. What specific project or question do you have in mind?`,
        ];
        fallbackReply = pickRandom(greetingOptions);
        quickReplies = [
          "Calculate 3-Bedroom Cost",
          "Land Due Diligence Steps",
          "Check Flood Risk in Accra",
          "Find Verified Contractors",
        ];
      } else if (isGenericPleasantry) {
        const pleasantryOptions = [
          `I am glad to help! Let me know if you need assistance with land searches, construction estimates, or finding verified contractors in Ghana.`,
          `Hi, I am your TerraMatch AI assistant to help you navigate land and construction in Ghana. What specific question or project do you have in mind?`,
          `I'm glad to help! Feel free to ask about land due diligence, Ghanaian building costs, or finding verified contractors.`,
          `Happy to assist! What project or real estate question can I help you explore next?`,
        ];
        fallbackReply = pickRandom(pleasantryOptions);
        quickReplies = [
          "Estimate Construction Cost",
          "Check Land Due Diligence",
          "Inspect Flood Risk",
          "Find Top Contractors",
        ];
      } else if (qLower.includes("check") || qLower.includes("buying land") || qLower.includes("indenture") || qLower.includes("title") || qLower.includes("due diligence")) {
        fallbackReply = `### Essential Steps for Buying Land in Ghana:\n\n1. **Conduct a Search at Lands Commission**: Obtain a certified official search report covering the Public and Vested Land Management Division (PVLMD) and Land Registration Division (LRD).\n2. **Engage a Licensed Cadastral Surveyor**: Verify the site plan coordinates on-ground using GPS and check against the Lands Commission regional base map.\n3. **Inspect Stool / Family Lineage**: Confirm who holds the allodial title and whether the rightful Chief or Family Head is signing the Indenture.\n4. **Check for Planning Scheme / Zoning**: Ensure the land is zoned for your intended use (Residential/Commercial) at the local District Assembly.\n5. **Land Title Registration**: Register your Indenture to obtain a Land Title Certificate under the Land Act, 2020.`;
        quickReplies = ["How to check flood risk?", "Average construction cost", "Find verified surveyor"];
        fallbackWidget = "due_diligence";
      } else if (qLower.includes("flood") || qLower.includes("waterlog") || qLower.includes("drainage") || qLower.includes("soil") || qLower.includes("terrain")) {
        fallbackReply = `### Flood & Terrain Risk Assessment in Ghana:\n\n- **Low-Risk / Elevated Zones**: East Legon Hills, Haatso, Oyarifa, Abokobi, Ayi Mensah, McCarthy Hill, and the Aburi Ridge sit on elevated bedrock with excellent natural gravity drainage.\n- **High-Risk Low-Lying Zones**: Alajo, Odawna (Circle), Weija basin, Sakumono lagoon plains, and lower Spintex road require specialized raft/pile foundations and raised sub-base engineering.\n- **Recommended Foundation**: In waterlogged or clay soils, use a **reinforced raft foundation** with waterproof concrete admixtures and comprehensive perimeter French drains.`;
        quickReplies = ["Check East Legon Hills", "Foundation cost estimate", "Recommend Civil Engineer"];
        fallbackWidget = "soil_flood";
      } else if (qLower.includes("cost") || qLower.includes("3-bedroom") || qLower.includes("price") || qLower.includes("budget") || qLower.includes("estimate") || qLower.includes("calculator")) {
        fallbackReply = `### Estimated Construction Costs in Ghana (2025/2026 Baseline):\n\n- **Standard 3-Bedroom House (Foundation to Roofing)**: Approximately **GHS 180,000 – GHS 320,000** for structural carcass.\n- **Full High-End Finishing (POP, Porcelain Tiles, Electricals & Plumbing)**: **GHS 120,000 – GHS 250,000** additional.\n- **Building Permit Fees**: Typically **GHS 3,500 – GHS 8,000** depending on the Municipal Assembly (e.g. Ayawaso, Ga East, Kpone Katamanso).\n- **Tips to Save Cost**: Buy quality sand and quarry stones in bulk, purchase high-tensile steel from certified distributors, and hire verified contractors with fixed milestone payments.`;
        quickReplies = ["Find Building Contractors", "Get Architectural Plan", "Post this project"];
        fallbackWidget = "cost_estimator";
      } else if (
        qLower.includes("contractor") ||
        qLower.includes("builder") ||
        qLower.includes("artisan") ||
        qLower.includes("hire") ||
        qLower.includes("storey") ||
        qLower.includes("house") ||
        qLower.includes("building") ||
        qLower.includes("construction") ||
        qLower.includes("electrician") ||
        qLower.includes("plumber") ||
        qLower.includes("architect") ||
        qLower.includes("engineer") ||
        qLower.includes("surveyor") ||
        qLower.includes("mason") ||
        qLower.includes("recommend") ||
        qLower.includes("aid")
      ) {
        const contractorReplies = [
          `These are some contractors who can aid you with your project. Here are some recommendations based on verified ratings and specialties:`,
          `Here are some recommendations of verified contractors who can aid you with your project:`,
          `These are some top recommendations for contractors suited to aid your project requirements:`,
          `Here are some verified builders and contractors ready to assist with your construction plans:`,
        ];
        fallbackReply = pickRandom(contractorReplies);
        quickReplies = ["Find Top Contractors", "Estimate Construction Cost", "Post this project"];
      } else {
        const defaultReplies = [
          `Here are some recommendations and guidance for your project. What specific question or project do you have in mind?`,
          `I am glad to help! Here is some guidance and recommendations for your project. What specific details would you like to explore?`,
          `Hi, I am your TerraMatch AI assistant to help you. What specific question or project do you have in mind?`,
        ];
        fallbackReply = pickRandom(defaultReplies);
        quickReplies = [
          "Estimate Construction Cost",
          "Verify Land Title Certificate",
          "Check Flood & Soil Risk",
          "Find Verified Contractors",
        ];
      }

      const generatedBrief = isGreetingOrPleasantry
        ? null
        : {
            title: effectiveBrief.title || (inferredCategory ? `${inferredCategory} Project in Ghana` : null),
            category: effectiveBrief.category || inferredCategory || null,
            description: effectiveBrief.description || (userMessage.length > 20 ? userMessage : null),
            location: effectiveBrief.location || (qLower.includes("accra") ? "Accra, Greater Accra" : qLower.includes("kumasi") ? "Kumasi, Ashanti" : null),
            budgetRange: effectiveBrief.budgetRange || null,
            timeline: effectiveBrief.timeline || null,
          };

      responseText = `${fallbackReply}\n\n\`\`\`json\n${JSON.stringify(
        {
          projectBrief: generatedBrief,
          interactiveWidget: fallbackWidget,
          readyToPost: !!(generatedBrief && generatedBrief.title && generatedBrief.category),
          searchCriteria: { contractorSpecialty: generatedBrief?.category || null },
          quickReplies,
        },
        null,
        2
      )}\n\`\`\``;
    }

    // Parse JSON block from response
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        parsedJson = JSON.parse(jsonMatch[1]);
        replyMarkdown = responseText.replace(jsonMatch[0], "").trim();
      } catch (e) {
        console.error("Failed to parse JSON block from AI response:", e);
      }
    } else {
      const rawJsonMatch = responseText.match(/\{[\s\S]*"(projectBrief|searchCriteria)"[\s\S]*\}/);
      if (rawJsonMatch) {
        try {
          parsedJson = JSON.parse(rawJsonMatch[0]);
          replyMarkdown = responseText.replace(rawJsonMatch[0], "").trim();
        } catch (e) {}
      }
      if (!replyMarkdown) replyMarkdown = responseText;
    }

    let dbBrief = isGreetingOrPleasantry ? {} : { ...effectiveBrief };
    if (parsedJson?.projectBrief && !isGreetingOrPleasantry) {
      Object.entries(parsedJson.projectBrief).forEach(([k, v]) => {
        if (v) dbBrief[k] = v;
      });
    }
    if (parsedJson?.searchCriteria?.contractorSpecialty && !isGreetingOrPleasantry) {
      dbBrief.category = parsedJson.searchCriteria.contractorSpecialty;
    }

    // Heuristic widget detection if not specified in JSON and not a greeting
    let activeWidget = isGreetingOrPleasantry ? null : (parsedJson?.interactiveWidget || null);
    if (!activeWidget && !isGreetingOrPleasantry) {
      const userText = userMessage.toLowerCase();
      if (userText.includes("cost") || userText.includes("estimate") || userText.includes("calculator") || userText.includes("budget") || userText.includes("bedroom")) {
        activeWidget = "cost_estimator";
      } else if (userText.includes("due diligence") || userText.includes("indenture") || userText.includes("checklist") || userText.includes("buying land") || userText.includes("lands commission")) {
        activeWidget = "due_diligence";
      } else if (userText.includes("flood") || userText.includes("soil") || userText.includes("terrain") || userText.includes("elevation")) {
        activeWidget = "soil_flood";
      }
    }

    // Evaluate contractors ONLY when user explicitly inquires about contractors/services or has a project brief
    let returnedMatches = [];
    const userText = userMessage.toLowerCase();
    const isAskingForContractors =
      userText.includes("contractor") ||
      userText.includes("builder") ||
      userText.includes("build") ||
      userText.includes("artisan") ||
      userText.includes("hire") ||
      userText.includes("storey") ||
      userText.includes("house") ||
      userText.includes("electrician") ||
      userText.includes("plumber") ||
      userText.includes("architect") ||
      userText.includes("engineer") ||
      userText.includes("surveyor") ||
      userText.includes("mason") ||
      userText.includes("recommend") ||
      userText.includes("aid") ||
      (parsedJson?.searchCriteria?.contractorSpecialty && !isGreetingOrPleasantry) ||
      (dbBrief.category && dbBrief.title);

    if (isAskingForContractors && !isGreetingOrPleasantry) {
      const formatted = await getContractorsFromDbOrFallback();
      returnedMatches = formatted
        .map((contractor) => {
          const { score, reasons } = scoreContractor(contractor, dbBrief);
          return { contractor, score, reasons };
        })
        .sort((a, b) => b.score - a.score || (b.contractor.rating || 0) - (a.contractor.rating || 0))
        .slice(0, 3);
    }

    res.json({
      reply: replyMarkdown,
      matches: returnedMatches,
      parsedIntent: parsedJson,
      projectBrief: dbBrief.title ? dbBrief : null,
      interactiveWidget: activeWidget,
      quickReplies: parsedJson?.quickReplies || [
        "Estimate Construction Cost",
        "Check Land Due Diligence",
        "Inspect Flood & Soil Risk",
        "Find Verified Contractors",
      ],
    });
  } catch (error) {
    next(error);
  }
}

export async function analyzeLandEnvironment(req, res, next) {
  try {
    const { lat, lng, region = "Greater Accra", locationName = "" } = req.query;

    const latitude = parseFloat(lat) || 5.6037;
    const longitude = parseFloat(lng) || -0.187;
    const loc = (locationName || region).toLowerCase();

    // Ghana Geospatial Environmental Knowledge Base
    let floodRisk = "LOW";
    let elevationMeters = 54.0;
    let terrainType = "GENTLE_SLOPE";
    let drainageQuality = "GOOD";
    let soilSuitability = "Optimal red laterite with high bearing capacity";
    let zoningStatus = "Approved Residential / Mixed Development";
    let waterTableDepth = "5.5 meters";
    let riskNotes = "Favorable high-ground topography with natural surface runoff.";

    // Low-lying coastal/lagoon basins
    if (
      loc.includes("alajo") ||
      loc.includes("circle") ||
      loc.includes("odawna") ||
      loc.includes("weija") ||
      loc.includes("sakumono") ||
      loc.includes("glefe") ||
      loc.includes("dansoman") ||
      latitude < 5.53
    ) {
      floodRisk = "HIGH";
      elevationMeters = 8.5;
      terrainType = "LOWLAND_BASIN";
      drainageQuality = "POOR";
      soilSuitability = "Alluvial clay/silt with moderate waterlogging potential";
      waterTableDepth = "1.8 meters";
      riskNotes = "Requires raised sub-base, perimeter culvert drains, and waterproof raft foundation.";
    } else if (
      loc.includes("aburi") ||
      loc.includes("akuapem") ||
      loc.includes("mccarthy") ||
      loc.includes("ridge") ||
      latitude > 5.75
    ) {
      // Mountain/ridge formations
      elevationMeters = 395.0;
      terrainType = "ELEVATED_RIDGE";
      floodRisk = "VERY_LOW";
      drainageQuality = "EXCELLENT";
      soilSuitability = "Quartzite rock and rocky substrata with exceptional foundation strength";
      waterTableDepth = "12.0 meters";
      riskNotes = "Steep terrain may require terracing and reinforced concrete retaining walls.";
    } else if (
      loc.includes("east legon hills") ||
      loc.includes("haatso") ||
      loc.includes("oyarifa") ||
      loc.includes("abokobi") ||
      loc.includes("ayi mensah") ||
      loc.includes("pokuase")
    ) {
      // High-demand prime northern Accra plains
      elevationMeters = 82.0;
      terrainType = "ELEVATED_PLATEAU";
      floodRisk = "LOW";
      drainageQuality = "GOOD";
      soilSuitability = "Cohesive sandy clay laterite (optimal for multi-storey residential builds)";
      waterTableDepth = "7.2 meters";
      riskNotes = "Ideal building ground with established road layouts and standard foundation depth.";
    } else if (loc.includes("kumasi") || loc.includes("ashanti")) {
      elevationMeters = 250.0;
      terrainType = "ROLLING_HILLS";
      floodRisk = "LOW";
      drainageQuality = "GOOD";
      soilSuitability = "Forest Ochrosols with excellent structural compaction";
      waterTableDepth = "6.0 meters";
      riskNotes = "Solid ground conditions; verify storm water channel distance.";
    }

    res.json({
      coordinates: { lat: latitude, lng: longitude },
      region,
      locationName: locationName || region,
      environmentalAssessment: {
        floodRisk,
        elevationMeters,
        terrainType,
        drainageQuality,
        soilSuitability,
        zoningStatus,
        waterTableDepth,
        riskNotes,
      },
    });
  } catch (error) {
    next(error);
  }
}

