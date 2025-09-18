/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "GET":
      {
        try {
          const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
          });

          if (!session) {
            res.status(401).json({ error: "Unauthorized" });
            return;
          }

          if (session.user.role !== "admin") {
            res.status(403).json({ error: "Forbidden" });
            return;
          }

          // Parse query parameters
          const {
            page = "1",
            limit = "10",
            search = "",
            minCorrect = "",
            maxCorrect = "",
            sortBy = "full_name",
            sortOrder = "asc",
          } = req.query;

          const pageNum = Math.max(1, parseInt(page as string, 10));
          const limitNum = Math.max(
            1,
            Math.min(100, parseInt(limit as string, 10))
          ); // Max 100 items per page
          const offset = (pageNum - 1) * limitNum;

          let query = db
            .selectFrom("quiz_attempt")
            .leftJoin("user", "user.id", "quiz_attempt.user_id")
            .leftJoin("question", "question.id", "quiz_attempt.question_id")
            .select([
              "user.id as user_id",
              "user.name as full_name",
              "user.phoneNumber as phone_number",
              "quiz_attempt.question_id",
              "quiz_attempt.answer as selected_answer",
              "quiz_attempt.is_correct",
              "question.number as question_number",
            ]);

          // Apply search filter
          if (search) {
            query = query.where((eb) =>
              eb.or([
                eb("user.name", "ilike", `%${search}%`),
                eb("user.phoneNumber", "ilike", `%${search}%`),
              ])
            );
          }

          const usersData = await query.execute();

          // Group by user and organize answers by question number
          const tableData = usersData.reduce((acc, row) => {
            const userId = row.user_id;

            if (!userId) return acc;

            if (!acc[userId]) {
              acc[userId] = {
                user_id: userId,
                full_name: row.full_name || "Неизвестно",
                phone_number: row.phone_number || "Не указан",
                correct_count: 0,
                questions: [], // Group answers in this array
              };

              // Initialize 50 question objects in array
              for (let i = 0; i < 50; i++) {
                acc[userId].questions[i] = {
                  answer: "",
                  correct: 0,
                };
              }
            }

            if (row.question_number && row.selected_answer) {
              // Use question_number - 1 for array index (assuming questions are numbered 1-50)
              acc[userId].questions[row.question_number - 1] = {
                answer: row.selected_answer,
                correct: row.is_correct ? 1 : 0,
              };

              if (row.is_correct) {
                acc[userId].correct_count++;
              }
            }

            return acc;
          }, {} as Record<string, any>);

          // Convert to array
          let tableRows = Object.values(tableData);

          // Apply correct count filters
          if (minCorrect) {
            const minCorrectNum = parseInt(minCorrect as string, 10);
            tableRows = tableRows.filter(
              (user: any) => user.correct_count >= minCorrectNum
            );
          }
          if (maxCorrect) {
            const maxCorrectNum = parseInt(maxCorrect as string, 10);
            tableRows = tableRows.filter(
              (user: any) => user.correct_count <= maxCorrectNum
            );
          }

          // Apply sorting
          tableRows.sort((a: any, b: any) => {
            let aValue = a[sortBy as string];
            let bValue = b[sortBy as string];

            // Handle different data types
            if (typeof aValue === "string") {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }

            if (sortOrder === "desc") {
              return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
              return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
          });

          // Get total count before pagination
          const totalItems = tableRows.length;
          const totalPages = Math.ceil(totalItems / limitNum);

          // Apply pagination
          const paginatedRows = tableRows
            .slice(offset, offset + limitNum)
            .map((user, index) => ({
              row_number: offset + index + 1,
              ...user,
            }));

          res.status(200).json({
            users: paginatedRows,
            pagination: {
              page: pageNum,
              limit: limitNum,
              totalItems,
              totalPages,
              hasNext: pageNum < totalPages,
              hasPrev: pageNum > 1,
            },
            filters: {
              search,
              minCorrect,
              maxCorrect,
              sortBy,
              sortOrder,
            },
          });
        } catch (error) {
          console.error("Error in users handler:", error);
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
