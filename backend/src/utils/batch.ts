import { PrismaClient } from "@prisma/client";
import { Pinecone } from "@pinecone-database/pinecone";
import { fetchScholarships } from "./scrape";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Use Gemini for embeddings

const prisma = new PrismaClient();
const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "your-api-key",
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, (error as Error).message);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay * (i + 1)));
      }
    }
  }
  throw new Error("Max retries reached");
};

// Helper function to resize the embedding to 1024 dimensions
export const resizeEmbedding = (embedding: number[], targetSize: number) => {
  if (embedding.length === targetSize) return embedding;
  if (embedding.length > targetSize) return embedding.slice(0, targetSize);
  return [...embedding, ...Array(targetSize - embedding.length).fill(0)]; // Zero padding if smaller
};

// Function to generate the embeddings
const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await embeddingModel.embedContent(text);
    if (!response.embedding) {
      throw new Error("Embedding data not found in response.");
    }
    return resizeEmbedding(response.embedding.values, 1024); // Resize embedding to 1024 dimensions
  } catch (error) {
    console.error("Error generating embedding:", (error as Error).message);
    throw new Error("Failed to generate embedding");
  }
};

// Function to chunk data into batches of a specified size
const chunkData = <T>(data: T[], batchSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < data.length; i += batchSize) {
    chunks.push(data.slice(i, i + batchSize));
  }
  return chunks;
};

export const processScholarships = async () => {
  try {
    console.log("🔍 Fetching scholarships...");
    const scholarships = await fetchScholarships();

    if (scholarships.length === 0) {
      console.log("✅ No new scholarships found.");
      return;
    }

    console.log(
      `🧠 Generating embeddings for ${scholarships.length} scholarships...`
    );
    const embeddings = await Promise.all(
      scholarships.map(async (s) => {
        const textToEmbed = `
          Title: ${s.title}
          Deadline: ${s.deadline}
          About: ${s.moreInfo.about}
          Eligibility: ${s.moreInfo.eligibility}
          Benefits: ${s.moreInfo.benefits}
          Documents: ${s.moreInfo.documents}
          How To Apply: ${s.moreInfo.howToApply}
          Important Dates: ${s.moreInfo.importantDates}
        `.trim();

        return await generateEmbedding(textToEmbed);
      })
    );

    console.log("🗄️ Storing scholarships in PostgreSQL...");
    await retry(() =>
      prisma.scholarship.createMany({
        data: scholarships.map((s) => ({
          title: s.title,
          deadline: s.deadline,
          link: s.link,
          about: s.moreInfo?.about || "",
          applyLink: s.moreInfo?.applyLink || "",
          eligibility: s.moreInfo?.eligibility || "",
          benefits: s.moreInfo?.benefits || "",
          documents: s.moreInfo?.documents || "",
          howToApply: s.moreInfo?.howToApply || "",
          importantDates: s.moreInfo?.importantDates || "",
        })),
        skipDuplicates: true,
      })
    );

    console.log("🗂️ Storing embeddings in Pinecone...");
    // Prepare Pinecone vectors with metadata
    const pineconeVectors = scholarships.map((s, index) => ({
      id: s.link, // Unique identifier for the vector (e.g., scholarship link)
      values: embeddings[index], // Resized embedding vector
      metadata: {
        title: s.title,
        deadline: s.deadline,
        link: s.link,
        eligibility: s.moreInfo.eligibility,
      },
    }));

    const index = pineconeClient.Index("scholarship-index");

    const batchSize = 1000;
    const recordChunks = chunkData(pineconeVectors, batchSize);

    for (const chunk of recordChunks) {
      await retry(() => index.upsert(chunk));
      console.log(`✅ Batch of ${chunk.length} records upserted to Pinecone.`);
    }

    console.log("🎉 Scholarships successfully stored!");
  } catch (error) {
    console.error(
      "❌ Error processing scholarships:",
      (error as Error).message
    );
  } finally {
    await prisma.$disconnect();
  }
};
