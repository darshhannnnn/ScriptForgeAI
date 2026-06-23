import dotenv from 'dotenv';
import path from 'path';
import { executeAgent } from '../lib/agents/unified-executor';
import type { AgentContext } from '../lib/agents/agent-executor';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const context: AgentContext = {
    storyBrief: "A futuristic detective searches for a missing AI counselor in Neo-Tokyo.",
    previousResults: {},
    apiKey: process.env.GOOGLE_GEMINI_API_KEY // which starts with AQ.Ab... (invalid)
  };

  console.log("Starting verification run with key:", context.apiKey?.substring(0, 8) + "...");
  
  try {
    const result = await executeAgent('story-intelligence', context);
    console.log("UNEXPECTED SUCCESS (Silent Fallback occurred):", result);
  } catch (error: any) {
    console.log("EXPECTED FAILURE (Error was correctly propagated):");
    console.log("Error Message:", error.message);
  }
}

run().catch(console.error);
