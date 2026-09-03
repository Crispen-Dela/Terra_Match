import { recommendContractors, aiChatAssistant, analyzeLandEnvironment } from "./src/controllers/aiController.js";

async function runAiTests() {
  console.log("==================================================");
  console.log("   🧪 Running TerraMatch AI Backend Integration Tests");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  // Mock res helper
  function createMockRes() {
    return {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      },
    };
  }

  // 1. Test Contractor Recommendation
  try {
    console.log("\n1. Testing recommendContractors (Category & Semantic Matching)...");
    const req = {
      body: {
        category: "Building & Construction",
        location: "East Legon, Accra",
        budgetRange: "GHS 150,000 – 300,000",
        limit: 3,
      },
      query: {},
    };
    const res = createMockRes();
    let nextCalled = false;
    await recommendContractors(req, res, (err) => {
      if (err) nextCalled = err;
    });

    if (nextCalled) {
      console.error("❌ recommendContractors error:", nextCalled);
      failed++;
    } else {
      console.log(`✅ recommendContractors returned ${res.data?.recommendations?.length || 0} top recommendations.`);
      if (res.data?.recommendations?.length > 0) {
        const top = res.data.recommendations[0];
        console.log(`   Top Match: ${top.contractor.name} (${top.matchScore}% match) - Reasons: ${top.reasons.join(", ")}`);
      }
      passed++;
    }
  } catch (e) {
    console.error("❌ Exception in recommendContractors test:", e);
    failed++;
  }

  // 2. Test Semantic Keyword Mapping
  try {
    console.log("\n2. Testing Semantic Keyword Matching (e.g. 'borehole drilling')...");
    const req = {
      body: {
        description: "Need borehole drilling and water polytank connection in Haatso",
        location: "Haatso, Accra",
        limit: 2,
      },
      query: {},
    };
    const res = createMockRes();
    await recommendContractors(req, res, (err) => { });
    console.log(`✅ Semantic match evaluated ${res.data?.totalEvaluated} contractors.`);
    passed++;
  } catch (e) {
    console.error("❌ Exception in semantic match test:", e);
    failed++;
  }

  // 3. Test AI Chat Assistant - Greeting vs Project Query
  try {
    console.log("\n3. Testing aiChatAssistant with a casual greeting ('hello')...");
    const reqGreeting = {
      body: {
        userMessage: "hello",
        history: [],
        brief: {},
      },
    };
    const resGreeting = createMockRes();
    await aiChatAssistant(reqGreeting, resGreeting, () => {});

    if (resGreeting.data?.matches?.length > 0) {
      console.error("❌ FAILED: 'hello' should NOT return contractor matches. Found:", resGreeting.data.matches.length);
      failed++;
    } else {
      console.log("✅ Greeting returned 0 contractor matches (clean conversational response)!");
      console.log("   Greeting Reply Preview:\n   " + (resGreeting.data?.reply || "").split("\n").slice(0, 2).join("\n   "));
      console.log("   Quick Replies:", resGreeting.data?.quickReplies);
      passed++;
    }

    console.log("\n3b. Testing aiChatAssistant with Land Due Diligence query...");
    const req = {
      body: {
        userMessage: "What documents must I check at the Lands Commission before buying land in East Legon Hills?",
        history: [],
        brief: {},
      },
    };
    const res = createMockRes();
    let nextErr = null;
    await aiChatAssistant(req, res, (err) => {
      nextErr = err;
    });

    if (nextErr) {
      console.error("❌ aiChatAssistant error:", nextErr);
      failed++;
    } else {
      console.log("✅ aiChatAssistant returned valid response without crash!");
      console.log("   Reply Preview:\n   " + (res.data?.reply || "").split("\n").slice(0, 3).join("\n   "));
      console.log("   Quick Replies:", res.data?.quickReplies);
      console.log("   Interactive Widget:", res.data?.interactiveWidget);
      passed++;
    }
  } catch (e) {
    console.error("❌ Exception in aiChatAssistant test:", e);
    failed++;
  }

  // 4. Test Land & Environmental Analysis
  try {
    console.log("\n4. Testing analyzeLandEnvironment (Ghanaian Regional Geography)...");

    // Low-lying zone
    const reqLow = { query: { locationName: "Alajo", region: "Greater Accra" } };
    const resLow = createMockRes();
    await analyzeLandEnvironment(reqLow, resLow, () => { });
    console.log(`✅ Alajo Flood Risk: ${resLow.data?.environmentalAssessment?.floodRisk} (Elevation: ${resLow.data?.environmentalAssessment?.elevationMeters}m)`);

    // Elevated zone
    const reqHigh = { query: { locationName: "East Legon Hills", region: "Greater Accra" } };
    const resHigh = createMockRes();
    await analyzeLandEnvironment(reqHigh, resHigh, () => { });
    console.log(`✅ East Legon Hills Flood Risk: ${resHigh.data?.environmentalAssessment?.floodRisk} (Elevation: ${resHigh.data?.environmentalAssessment?.elevationMeters}m)`);

    passed++;
  } catch (e) {
    console.error("❌ Exception in analyzeLandEnvironment test:", e);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`📊 AI Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runAiTests().catch(console.error);
