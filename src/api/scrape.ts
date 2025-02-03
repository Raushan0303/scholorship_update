// pages/api/scrape.ts
import { NextApiRequest, NextApiResponse } from "next";
import { scrapeScholarships } from "@/lib/scraper"; // Path to your scraper function

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Simulate data fetching/scraping (this could be an actual scraping process)
      const data = await scrapeScholarships(); // Assume scrapeData() fetches the data
      console.log("Data scraped:", data); // Log the scraped data
      res.status(200).json(data); // Send the scraped data as a JSON response
    } catch (error: unknown) {
      console.error("Error occurred:", error); // Optionally log the error
      res.status(500).json({ error: "Failed to scrape data", details: error }); // Send error details
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" }); // Handle other HTTP methods
  }
}
