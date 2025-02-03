import axios, { AxiosError, AxiosResponse } from "axios";
import { chromium } from "playwright";

const API_URL = "https://api.buddy4study.com/api/v1.0/ssms/scholarship/";
let currentToken = "Bearer YOUR_INITIAL_TOKEN"; // Store the latest valid token

const JSON_DATA = {
  page: 0,
  length: 100,
  rules: [],
  mode: "OPEN",
  sortOrder: "DEADLINE",
};

export async function fetchScholarships() {
  while (true) {
    try {
      const response: AxiosResponse = await axios.post(API_URL, JSON_DATA, {
        headers: { authorization: currentToken },
      });

      if (response.status === 200) {
        console.log("✅ Fetched Data:", response.data);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response?.status === 401) {
          console.log("⏳ Token expired! Fetching new token...");
          const newToken = await getNewToken();

          if (newToken) {
            currentToken = `Bearer ${newToken}`; // Store the new valid token (prepend "Bearer")
            console.log("🔄 Retrying request with new token...");
          } else {
            console.error("❌ Failed to get new token! Exiting...");
            break;
          }
        } else {
          console.error("❌ Unexpected API Error:", axiosError.message);
          break;
        }
      } else {
        console.error("❌ An unknown error occurred:", error);
        break;
      }
    }
  }
}

async function getNewToken(): Promise<string | null> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Create a promise that will resolve when a request with the token is intercepted
  const tokenPromise = new Promise<string>((resolve, reject) => {
    // Listen for all outgoing requests
    page.on("request", (request) => {
      const authHeader = request.headers()["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        console.log("✅ New Token Captured:", token);
        resolve(token);
      }
    });

    // Set a timeout to avoid waiting indefinitely
    setTimeout(() => {
      reject("Timeout: Token not found!");
    }, 30000);
  });

  try {
    // Navigate to the target page; this may trigger requests that include the token
    await page.goto("https://www.buddy4study.com/scholarships", {
      waitUntil: "load", // Ensure the page loads completely
    });
    console.log("🔄 Please log in manually if required...");

    // Wait for the token to be captured or timeout
    const token = await tokenPromise;
    return token;
  } catch (error) {
    console.error("❌ Error in fetching new token:", error);
    return null;
  } finally {
    // Ensure the browser is closed regardless of the outcome
    await browser.close();
  }
}

// ✅ Test function
(async () => {
  const token = await getNewToken();
  console.log("🔹 Final Token:", token);
})();
