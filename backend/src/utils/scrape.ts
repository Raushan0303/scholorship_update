import { chromium } from "playwright";

type Scholarship = {
  title: string;
  deadline: string;
  link: string;
  moreInfo: {
    about: string;
    applyLink: string;
    eligibility: string;
    benefits: string;
    documents: string;
    howToApply: string;
    importantDates: string;
  };
};

export const scrapeScholarships = async (): Promise<Scholarship[]> => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.buddy4study.com/scholarships");

  await page.waitForLoadState("domcontentloaded");

  const scholarships: Scholarship[] = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll("a"));
    const results: Scholarship[] = [];

    allLinks.forEach((link) => {
      if (link.href.includes("/page/") && link.textContent?.trim()) {
        const title = link.textContent.trim();
        const deadlineElement = link
          .closest("div")
          ?.querySelector(".card-deadline");
        const deadline = deadlineElement
          ? deadlineElement.textContent?.trim() || "N/A"
          : "N/A";

        if (title && link.href) {
          results.push({
            title,
            deadline,
            link: link.href,
            moreInfo: {
              about: "N/A",
              applyLink: "N/A",
              eligibility: "N/A",
              benefits: "N/A",
              documents: "N/A",
              howToApply: "N/A",
              importantDates: "N/A",
            },
          });
        }
      }
    });

    return results.slice(0, 10);
  });

  for (let i = 0; i < scholarships.length; i++) {
    const scholarship = scholarships[i];
    const scholarshipPage = await browser.newPage();
    await scholarshipPage.goto(scholarship.link);
    await scholarshipPage.waitForLoadState("domcontentloaded");
    const moreInfo = await scholarshipPage.evaluate(() => {
      const sections = document.querySelectorAll("h2, h5");
      const data: {
        about: string;
        applyLink: string;
        eligibility: string;
        benefits: string;
        documents: string;
        howToApply: string;
        importantDates: string;
      } = {
        about: "N/A",
        applyLink: "N/A",
        eligibility: "N/A",
        benefits: "N/A",
        documents: "N/A",
        howToApply: "N/A",
        importantDates: "N/A",
      };

      let currentSection: keyof typeof data | "" = "";
      sections.forEach((el) => {
        const textContent = el.textContent?.trim();
        if (!textContent) return;

        // Debugging: Log the current section being processed
        console.log(`Processing section: ${textContent}`);

        // Match section headings to corresponding fields
        if (textContent.includes("About The ")) {
          currentSection = "about";
        } else if (textContent.includes("Eligibility")) {
          currentSection = "eligibility";
        } else if (textContent.includes("Benefits")) {
          currentSection = "benefits";
        } else if (textContent.includes("Documents")) {
          currentSection = "documents";
        } else if (textContent.includes("How can you apply?")) {
          currentSection = "howToApply";
        } else if (textContent.includes("Important Dates")) {
          currentSection = "importantDates";
        } else {
          return; // Skip if no matching section is found
        }

        // Extract content for the current section
        let content = "";
        let nextElement = el.nextElementSibling;
        while (nextElement && !nextElement.matches("h2, h5")) {
          if (nextElement.textContent) {
            content += nextElement.textContent.trim() + "\n";
          }
          nextElement = nextElement.nextElementSibling;
        }

        // Debugging: Log the extracted content
        console.log(`Extracted content for ${currentSection}:`, content);

        data[currentSection] = content.trim() || "N/A";
      });

      // Extract apply link
      const applyLinkElement = document.querySelector("a[href*='apply']");
      data.applyLink =
        applyLinkElement instanceof HTMLAnchorElement
          ? applyLinkElement.href
          : "N/A";

      // Debugging: Log the final data object
      console.log("Final moreInfo data:", data);

      return data;
    });

    // Assign correctly structured `moreInfo`
    scholarship.moreInfo = moreInfo;
    await scholarshipPage.close();
  }

  await browser.close();
  return scholarships;
};

const preprocessText = (text: string): string => {
  console.log("Original Text:", text); // Log the original text

  // 1. Convert to lowercase
  let processedText = text.toLowerCase();

  // 2. Remove punctuation
  processedText = processedText.replace(/[^\w\s]/g, "");

  // 3. Remove extra whitespaces
  processedText = processedText.replace(/\s+/g, " ").trim();

  // 4. Tokenize the text into words (split by spaces)
  const tokens = processedText.split(" ");

  // Optional: Remove stopwords
  // Uncomment the next line if you want to remove stopwords
  // tokens = removeStopwords(tokens);

  // Join tokens back to a string
  const finalProcessedText = tokens.join(" ");

  // Log the processed text
  return finalProcessedText;
};

const preprocessScholarships = (scholarships: Scholarship[]): Scholarship[] => {
  return scholarships.map((scholarship) => {
    return {
      ...scholarship,
      moreInfo: {
        about: preprocessText(scholarship.moreInfo.about),
        applyLink: scholarship.moreInfo.applyLink,
        eligibility: preprocessText(scholarship.moreInfo.eligibility),
        benefits: preprocessText(scholarship.moreInfo.benefits),
        documents: preprocessText(scholarship.moreInfo.documents),
        howToApply: preprocessText(scholarship.moreInfo.howToApply),
        importantDates: preprocessText(scholarship.moreInfo.importantDates),
      },
    };
  });
};

export const scrapeAndPreprocessScholarships = async (): Promise<
  Scholarship[]
> => {
  // First, scrape scholarships
  const scholarships = await scrapeScholarships();

  // Then, preprocess the scraped scholarships
  return preprocessScholarships(scholarships);
};
