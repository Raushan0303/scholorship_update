import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import cors from "cors";

import { fetchScholarships } from "./utils/scrape"; // Make sure to import the function

const prisma = new PrismaClient();
const app: Express = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Callback-Url"],
  })
);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to database");

    // Initial call to processScholarships when the server starts
    await fetchScholarships();

    // Call processScholarships every 5 minutes (300000 milliseconds)
    // setInterval(async () => {
    //   console.log("⏳ Calling processScholarships...");
    //   await processScholarships();
    // }, 300000); // 300000ms = 5 minutes

    const port = process.env.PORT || 3125;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export { prisma };
