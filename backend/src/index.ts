import express, { Express } from "express";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import cors from "cors";
import { scrapeAndPreprocessScholarships } from "./utils/scrape";

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
    scrapeAndPreprocessScholarships();
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
