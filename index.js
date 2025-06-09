import express from "express";
import { detectIntent } from "./intentDetection.js";
import { getStoreCurrency, getReturnPolicy, searchProductsByTitle } from "./shopifyAPI.js";

const app = express();
app.use(express.json());

// Homepage route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chat with Store Bot</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2em; }
          #response { margin-top: 1em; color: #333; }
          input[type="text"] { width: 300px; padding: 0.5em; }
          button { padding: 0.5em 1em; }
        </style>
      </head>
      <body>
        <h1>Store Chatbot</h1>
        <form id="chat-form">
          <input type="text" id="message" placeholder="Ask about currency or return policy..." required />
          <button type="submit">Send</button>
        </form>
        <div id="response"></div>
        <script>
          const form = document.getElementById('chat-form');
          const input = document.getElementById('message');
          const responseDiv = document.getElementById('response');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value;
            responseDiv.textContent = 'Thinking...';
            try {
              const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
              });
              const data = await res.json();
              responseDiv.textContent = data.answer;
            } catch (err) {
              responseDiv.textContent = 'Error: ' + err.message;
            }
            input.value = '';
          });
        </script>
      </body>
    </html>
  `);
});

// Chat API route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const intent = await detectIntent(userMessage);

  let answer;
  if (intent === "store_currency") {
    const currency = await getStoreCurrency();
    answer = `Your store's currency is ${currency}.`;
  } else if (intent === "return_policy") {
    const policy = await getReturnPolicy();
    answer = `Your return policy: ${policy}`;
  } else if (intent === "product_count") {
    const count = await getProductCount();
    answer = `There are ${count} products available in your store.`;
  } else if (intent === "top_product") {
    answer = await getTopProduct();
  } else if (intent === "search_product") {
    // Extract search term from user message (basic example)
    const searchTerm = extractSearchTerm(userMessage);
    const products = await searchProductsByTitle(searchTerm);
    if (products.length === 0) {
      answer = `No products found for "${searchTerm}".`;
    } else {
      answer = "Here are some matching products:\n" +
        products.map(p => `- ${p.title}`).join("\n");
    }
  }
   else {
    answer = "Sorry, I couldn't understand your question.";
  }

  res.json({ answer });
});

function extractSearchTerm(userMessage) {
  // Look for common search phrases and extract the term after them
  const patterns = [
    /find me (.+)/i,
    /show (?:me )?products? (?:called|named)? (.+)/i,
    /search for (.+)/i,
    /look for (.+)/i,
    /product (.+)/i
  ];
  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  // Fallback: return the whole message as search term
  return userMessage.trim();
}

app.listen(3000, () => console.log("Server running on port 3000"));
