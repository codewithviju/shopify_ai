import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07/graphql.json`;

// Generic Shopify GraphQL function
async function shopifyGraphQL(query) {
  const res = await fetch(SHOPIFY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Shopify API error: ${res.status} ${res.statusText} - ${errorText}`);
  }

  const data = await res.json();

  if (data.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data;
}

// Get store currency code
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

// Get return policy body
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
  // Defensive: Return a friendly message if no policy is set
  return data.data.shop.policies?.returnPolicy?.body || "No return policy set.";
}

export async function searchProductsByTitle(searchTerm) {
  // Use * for prefix search, e.g., title:shirt*
  const queryString = `title:${searchTerm}*`;
  const query = `
    {
      products(first: 5, query: "${queryString}") {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              originalSrc
            }
          }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(query);
  const products = data.data.products.edges.map(edge => edge.node);
  return products;
}

export async function getProductCount() {
  const query = `
    {
      products {
        totalCount
      }
    }
  `;
  const data = await shopifyGraphQL(query);
  return data.data.products.totalCount;
}

export async function getTopProduct() {
  const query = `
    {
      products(first: 1, sortKey: INVENTORY, reverse: true) {
        edges {
          node {
            title
            totalInventory
          }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(query);
  const topProduct = data.data.products.edges[0]?.node;
  if (!topProduct) return "No products found.";
  return `The product with the highest inventory is "${topProduct.title}" with ${topProduct.totalInventory} items in stock.`;
}
