import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/database";

interface Answer {
  question_id: string;
  answer: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  switch (method) {
    case "POST":
      {
        try {
          const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
          });

          if (!session) {
            res.status(401).json({ error: "Unauthorized" });
            return;
          }

          const { question_id: id, answer } = body as Answer;

          // Get question from database
          const question = await db
            .selectFrom("question")
            .selectAll()
            .where("id", "=", parseInt(id))
            .executeTakeFirst();

          if (!question) {
            return res.status(404).json({ error: "Question not found" });
          }

          // Insert user answer
          await db
            .insertInto("quiz_attempt")
            .values({
              question_id: question.id,
              answer: answer,
              is_correct: question.correct_answer === answer,
              user_id: session.user.id,
              score: question.correct_answer === answer ? 1 : 0,
            })
            .execute();

          res.status(200).json({
            message: "Ответ записан",
          });
        } catch (error) {
          console.error("Error in answer handler:", error);
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      }
      break;

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
