const dotenv = require('dotenv');
const path = require('path');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateObject } = require('ai');
const { z } = require('zod');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 5) : 'none');

  if (!apiKey) {
    console.error('No API key found in environment');
    process.exit(1);
  }

  const google = createGoogleGenerativeAI({ apiKey });
  
  const modelsToTest = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
  ];

  const schema = z.object({
    message: z.string()
  });

  for (const modelName of modelsToTest) {
    console.log(`\n--- Testing model: ${modelName} ---`);
    try {
      const model = google(modelName);
      const result = await generateObject({
        model,
        schema,
        prompt: 'Say hello in one word'
      });
      console.log(`Success! Result:`, result.object);
    } catch (err) {
      console.error(`Error with ${modelName}:`, err.message);
    }
  }
}

run().catch(console.error);
