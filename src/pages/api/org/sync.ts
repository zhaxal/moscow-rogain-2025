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

interface Question {
  org_id: string;
  number: string;
  question: string;
  correct_answer: string;
  incorrect_answer_1: string;
  incorrect_answer_2: string;
  incorrect_answer_3: string;
}

function parseCSV(filePath: string): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const questions: Question[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        questions.push({
          org_id: row["org_id"], // Default value if org_id is missing
          number: row["№ Вопроса"],
          question: row["Вопрос"],
          correct_answer: row["Верный ответ"],
          incorrect_answer_1: row["Неверный ответ"],
          incorrect_answer_2: row["Неверный ответ.1"] || row["Неверный ответ "],
          incorrect_answer_3:
            row["Неверный ответ.2"] || row["Неверный ответ  "],
        });
      })
      .on("end", () => {
        resolve(questions);
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
      uploadDir: os.tmpdir(), // Use OS-specific temp directory
      keepExtensions: true,
    });

    const [, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.csv) ? files.csv[0] : files.csv;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    // Parse CSV data
    const questions = await parseCSV(uploadedFile.filepath);

    // Database operations using Kysely
    await db.transaction().execute(async (trx) => {
      // Delete existing questions
      await trx.deleteFrom("question").execute();

      // Insert new questions from CSV
      if (questions.length > 0) {
        await trx
          .insertInto("question")
          .values(
            questions.map((question) => ({
              org_id: question.org_id,
              number: parseInt(question.number),
              question_text: question.question,
              correct_answer: question.correct_answer,
              incorrect_answer_1: question.incorrect_answer_1,
              incorrect_answer_2: question.incorrect_answer_2,
              incorrect_answer_3: question.incorrect_answer_3,
            }))
          )
          .execute();
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      message: "Вопросы успешно синхронизированы",
      questionsCreated: questions.length,
    });
  } catch (error) {
    console.error("Error in sync handler:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
