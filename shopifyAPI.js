import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`;

async function shopifyGraphQL(query) {
  const res = await fetch(SHOPIFY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  return data;
}

export async function getStoreCurrency() {
  const query = `
    {
      shop {
        currencyCode
      }
    }
  `;
  const data = await shopifyGraphQL(query);
  return data.data.shop.currencyCode;
}

export async function getReturnPolicy() {
  const query = `
    {
      shop {
        policies {
          returnPolicy {
            body
          }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(query);
  return data.data.shop.policies.returnPolicy.body;
}
