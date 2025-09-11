import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";

import PocketBase from "pocketbase";
import { Question } from "@/types/question";

const pb = new PocketBase("https://pb.rogain.moscow");
const login = process.env.PB_LOGIN;
const password = process.env.PB_PASSWORD;

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

          if (!login || !password) {
            return res
              .status(500)
              .json({ error: "App credentials are not set" });
          }

          const { question_id: id, answer } = body as Answer;

          await pb.collection("_superusers").authWithPassword(login, password);
          const question = await pb
            .collection<Question>("questions")
            .getOne(id);

          const data = {
            question_id: question.id,
            answer: answer,
            is_correct: question.correct_answer === answer,
            user_id: session.user.id,
          };

          await pb.collection("users_answers").create(data);

          pb.authStore.clear();

          res.status(200).json({
            message: "Ответ записан",
          });
        } catch (error) {
          console.error("Error in token handler:", error);
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
