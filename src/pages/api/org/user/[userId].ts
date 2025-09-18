/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/database";
import { sql } from "kysely";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;

  switch (method) {
    case "PATCH":
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

          const { userId } = query;
          const { new_number } = body;

          if (!userId) {
            res.status(400).json({ error: "Invalid userId" });
            return;
          }

          await db
            .updateTable("user")
            .set({ name: new_number })
            .where("id", "=", userId as string)
            .executeTakeFirst();

          // const results = await db
          //   .selectFrom("quiz_attempt")
          //   .leftJoin("user", "user.id", "quiz_attempt.user_id")
          //   .leftJoin("telemetry", "telemetry.start_number", "user.name")
          //   .groupBy([
          //     "user_id",
          //     "user.name",
          //     "user.phoneNumber",
          //     "telemetry.group",
          //   ])
          //   .select([
          //     "user_id",
          //     "user.name as start_number",
          //     "user.phoneNumber as phone_number",
          //     "telemetry.group as group_name",
          //     db.fn.count("quiz_attempt.is_correct").as("total_questions"),
          //     db.fn
          //       .sum(sql`CASE WHEN quiz_attempt.is_correct THEN 1 ELSE 0 END`)
          //       .as("quiz_points"),
          //     db.fn.sum("telemetry.points").as("telemetry_points"),

          //     sql`COALESCE(SUM(CASE WHEN quiz_attempt.is_correct THEN 1 ELSE 0 END), 0) + COALESCE(SUM(telemetry.points), 0)`.as(
          //       "total_points"
          //     ),
          //   ])
          //   .execute();

          res.status(200).json({
            message: "User number updated successfully",
          });
        } catch (error) {
          console.error("Error in users handler:", error);
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      }
      break;

    default:
      res.setHeader("Allow", ["PATCH"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
