import axios, { AxiosError, AxiosResponse } from "axios";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { decode } from "html-entities";

const prisma = new PrismaClient();
const API_URL = "https://api.buddy4study.com/api/v1.0/ssms/scholarship/";
let currentToken = "Bearer YOUR_INITIAL_TOKEN"; // Store the latest valid token

// Function to get slugs from the database
async function getSlugsFromDB(): Promise<string[]> {
  const slugs = await prisma.slug.findMany({
    select: { slug: true },
  });

  return slugs.map((s) => s.slug);
}

async function fetchScholarshipDetails(slug: string) {
  try {
    const response: AxiosResponse = await axios.get(`${API_URL}${slug}`, {
      headers: { authorization: currentToken },
    });

    if (response.status === 200) {
      console.log(`✅ Scholarship Data for ${slug}:`, response.data);

      // Remove HTML tags from all fields and clean the data
      const cleanedData = cleanScholarshipData(
        response.data.scholarshipBodyMultilinguals
      );

      console.log(`📌 Cleaned Data for ${slug}:`, cleanedData);
    } else {
      console.warn(`⚠ Failed to fetch details for ${slug}:`, response.status);
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
          await fetchScholarshipDetails(slug);
        } else {
          console.error("❌ Failed to get new token! Skipping this slug...");
        }
      } else {
        console.error(`❌ API Error for ${slug}:`, axiosError.message);
      }
    } else {
      console.error(`❌ Unknown error for ${slug}:`, error);
    }
  }
}

// Function to clean scholarship data
function cleanScholarshipData(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (!data || typeof data !== "object") return data;

  const cleanedData: Record<string, unknown> = {};
  for (const key in data) {
    if (typeof data[key] === "string") {
      cleanedData[key] = removeHtmlTags(data[key] as string);
    } else if (Array.isArray(data[key])) {
      cleanedData[key] = (data[key] as unknown[]).map((item) =>
        cleanScholarshipData(item as Record<string, unknown>)
      ); // Recursively clean arrays
    } else if (typeof data[key] === "object") {
      cleanedData[key] = cleanScholarshipData(
        data[key] as Record<string, unknown>
      );
    } else {
      cleanedData[key] = data[key];
    }
  }
  return cleanedData;
}

function removeHtmlTags(html: string): string {
  if (!html) return "";

  const $ = cheerio.load(html);

  let text = decode($.root().text()).replace(/\s+/g, " ").trim();

  text = text
    .replace(/\t/g, "")
    .replace(/Step \d+:/g, "\n$&")
    .replace(/<li>/g, "\n- ")
    .replace(/<strong>/g, "")
    .replace(/<\/strong>/g, "")
    .replace(/<p>/g, "\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<br>/g, "\n");

  return text;
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

export async function fetchAllScholarshipDetails() {
  const slugs = await getSlugsFromDB();
  const testSlugs = slugs.slice(0, 2);

  console.log(`📌 Testing with ${testSlugs.length} slugs.`);

  for (const slug of testSlugs) {
    await fetchScholarshipDetails(slug);
  }
}
