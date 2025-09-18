import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";

import formidable from "formidable";
import fs from "fs";
import csv from "csv-parser";
import os from "os";
import { db } from "@/database";

// Disable body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface Result {
  start_number: string;
  points: string;
  group: string;

  // Add more fields as needed for checkpoint data
}

function parseCSV(filePath: string): Promise<Result[]> {
  return new Promise((resolve, reject) => {
    const results: Result[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (row) => {
        // Map the Russian column headers to our interface
        results.push({
          group: row["Группа"] || "",
          start_number: row["Номер участника"] || "",
          points: row["Баллы"] || "",
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Parse the uploaded file with proper temp directory
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
    });

    const [, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.csv) ? files.csv[0] : files.csv;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    // Parse CSV data
    const results = await parseCSV(uploadedFile.filepath);

    // Database operations using Kysely
    await db.transaction().execute(async (trx) => {
      // Delete existing results
      await trx.deleteFrom("telemetry").execute();

      // Insert new results from CSV
      if (results.length > 0) {
        // Filter out invalid results and validate data
        const validResults = results.filter((result) => {
          const startNumber = result.start_number;
          const points = parseInt(result.points, 10);
          const group = result.group;
          return (
            !isNaN(points) && startNumber.trim() !== "" && group.trim() !== ""
          );
        });

        if (validResults.length > 0) {
          await trx
            .insertInto("telemetry")
            .values(
              validResults.map((result) => ({
                group: result.group,
                start_number: result.start_number,
                points: parseInt(result.points, 10),
              }))
            )
            .execute();
        }
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      message: "Результаты успешно синхронизированы",
      resultsCreated: results.length,
    });
  } catch (error) {
    console.error("Error in results sync handler:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
