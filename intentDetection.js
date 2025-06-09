import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectIntent(userMessage) {
  const prompt = `
You are an intent classifier for a Shopify store chatbot. Classify the user's question into one of these intents:
- return_policy
- store_currency
- product_count
- top_product
- search_product
- unknown

User: "${userMessage}"
Intent:
  `;
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  });
  return res.choices[0].message.content.trim();
}

