// lib/scraper.ts
import { chromium } from "playwright";

// lib/scraper.ts

interface Scholarship {
  name: string;
  eligibility: string;
  caste: string;
  religion: string;
  state: string;
  eligibilityAge: number;
  qualification: string;
  url: string;
  applicationLink: string;
}

export const scrapeScholarships = async (): Promise<Scholarship[]> => {
  const browser = await chromium.launch(); // Launch Playwright browser
  const page = await browser.newPage(); // Open a new page

  await page.goto("https://scholarships.gov.in/"); // Visit the website you want to scrape

  // Scrape the data

  const data = await page.evaluate(() => {
    const scholarships: Scholarship[] = []; // Explicitly declare the type here

    // Example selector, you need to inspect the website to get the correct selectors
    const rows = document.querySelectorAll(".scholarship-row");
    rows.forEach((row) => {
      const name =
        row.querySelector(".scholarship-name")?.textContent?.trim() || "";
      const eligibility =
        row.querySelector(".eligibility")?.textContent?.trim() || "";
      const caste = row.querySelector(".caste")?.textContent?.trim() || "";
      const religion =
        row.querySelector(".religion")?.textContent?.trim() || "";
      const state = row.querySelector(".state")?.textContent?.trim() || "";
      const eligibilityAge = parseInt(
        row.querySelector(".eligibility-age")?.textContent?.trim() || "0"
      );
      const qualification =
        row.querySelector(".qualification")?.textContent?.trim() || "";
      const url =
        row.querySelector(".scholarship-url")?.textContent?.trim() || "";
      const applicationLink =
        row.querySelector(".application-link")?.getAttribute("href") || "";

      scholarships.push({
        name,
        eligibility,
        caste,
        religion,
        state,
        eligibilityAge,
        qualification,
        url,
        applicationLink,
      });
    });
    console.log(scholarships); // Log the scraped data

    return scholarships;
  });

  await browser.close(); // Close the browser after scraping
  return data; // Return the scraped data
};
