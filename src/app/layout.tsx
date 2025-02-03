// app/layout.tsx
"use client"; // Mark this file for client-side rendering
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/scrape");
      console.log("Response from API:", response);
      if (response.ok) {
        const data = await response.json();
        console.log("Data fetched from API:", data);
      } else {
        console.error("Failed to fetch data");
      }
    };

    fetchData();
  }, []);

  return (
    <html lang="en">
      <head>
        {/* You can add meta tags, title, and other head content here */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Next.js App</title>
      </head>
      <body>
        {/* Global layout content */}
        <main>{children}</main> {/* This will render the page content */}
      </body>
    </html>
  );
}
