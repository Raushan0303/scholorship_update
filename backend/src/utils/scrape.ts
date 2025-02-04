import axios, { AxiosError, AxiosResponse } from "axios";
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const API_URL = "https://api.buddy4study.com/api/v1.0/ssms/scholarship/";
let currentToken = "Bearer YOUR_INITIAL_TOKEN"; // Store the latest valid token

const prisma = new PrismaClient();

const JSON_DATA = {
  page: 1,
  length: 100,
  rules: [],
  mode: "OPEN",
  sortOrder: "DEADLINE",
};

interface Scholarship {
  slug: string;
}

export async function fetchScholarships() {
  while (true) {
    try {
      const response: AxiosResponse = await axios.post(API_URL, JSON_DATA, {
        headers: { authorization: currentToken },
      });

      if (response.status === 200) {
        let scholarships: Scholarship[] = [];

        if (Array.isArray(response.data)) {
          scholarships = response.data;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          Array.isArray(response.data.scholarships)
        ) {
          scholarships = response.data.scholarships;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          Array.isArray(response.data.data)
        ) {
          scholarships = response.data.data;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          Array.isArray(response.data.results)
        ) {
          scholarships = response.data.results;
        } else {
          console.error(
            "Unexpected data structure. Keys found:",
            Object.keys(response.data)
          );
        }

        if (scholarships.length > 0) {
          console.log(`✅ Found ${scholarships.length} scholarships.`);

          // Extract unique slugs
          const uniqueSlugs = new Set(scholarships.map((s) => s.slug));

          // Check which slugs already exist in the DB
          const existingSlugs = new Set(
            (
              await prisma.slug.findMany({
                where: { slug: { in: [...uniqueSlugs] } },
                select: { slug: true },
              })
            ).map((s) => s.slug)
          );

          // Filter out slugs that are already in the database
          const newSlugsToInsert = [...uniqueSlugs]
            .filter((slug) => !existingSlugs.has(slug))
            .map((slug) => ({
              link: API_URL,
              slug,
            }));

          if (newSlugsToInsert.length > 0) {
            await prisma.slug.createMany({
              data: newSlugsToInsert,
              skipDuplicates: true, // Just in case
            });

            console.log(
              `🚀 Successfully inserted ${newSlugsToInsert.length} new slugs into the database.`
            );
          } else {
            console.log("⚠ No new scholarships to insert.");
          }
        } else {
          console.warn("⚠ No scholarship objects found.");
        }

        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          console.log("⏳ Token expired! Fetching new token...");
          const newToken = await getNewToken();
          if (newToken) {
            currentToken = `Bearer ${newToken}`;
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
  return null;
}

async function getNewToken(): Promise<string | null> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const tokenPromise = new Promise<string>((resolve, reject) => {
    page.on("request", (request) => {
      const authHeader = request.headers()["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        console.log("✅ New Token Captured:", token);
        resolve(token);
      }
    });

    setTimeout(() => {
      reject("Timeout: Token not found!");
    }, 30000);
  });

  try {
    await page.goto("https://www.buddy4study.com/scholarships", {
      waitUntil: "load",
    });
    console.log("🔄 Please log in manually if required...");

    const token = await tokenPromise;
    return token;
  } catch (error) {
    console.error("❌ Error in fetching new token:", error);
    return null;
  } finally {
    await browser.close();
  }
}
