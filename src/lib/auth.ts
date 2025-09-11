/* eslint-disable @typescript-eslint/no-explicit-any */
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { admin, phoneNumber } from "better-auth/plugins";
import { openAPI } from "better-auth/plugins";

import { MongoClient } from "mongodb";
import PocketBase from "pocketbase";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);

const dbName =
  process.env.ENVIRONMENT === "dev"
    ? "moscow-rogain-2025-dev"
    : "moscow-rogain-2025";
const db = client.db(dbName);

const adminEmails = ["zhaxa65@gmail.com"];

export const auth = betterAuth({
  database: mongodbAdapter(db),

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!!user.email && adminEmails.includes(user.email)) {
            return {
              data: {
                ...user,
                role: adminEmails.includes(user.email) ? "admin" : "user",
              },
            };
          } else {
            return {
              data: {
                ...user,
              },
            };
          }
        },

        after: async (user) => {
          const pb = new PocketBase("https://pb.rogain.moscow");
          const login = process.env.PB_LOGIN;
          const password = process.env.PB_PASSWORD;

          if (!login || !password) {
            throw new Error("App credentials are not set");
          }

          await pb.collection("_superusers").authWithPassword(login, password);

          const data = {
            id: user.id,
            name: user.name || "Игрок",
            phone_number: user.phoneNumber || "+70000000000",
          };

          await pb.collection("mongo_users").create(data);

          pb.authStore.clear();
        },
      },
      update: {
        after: async (user) => {
          const pb = new PocketBase("https://pb.rogain.moscow");
          const login = process.env.PB_LOGIN;
          const password = process.env.PB_PASSWORD;
          if (!login || !password) {
            throw new Error("App credentials are not set");
          }
          await pb.collection("_superusers").authWithPassword(login, password);

          const record = await pb
            .collection("mongo_users")
            .getFirstListItem(`id="${user.id}"`);
          if (record) {
            const data: any = {};
            if (user.name) data.name = user.name;
            if (user.phoneNumber) data.phone_number = user.phoneNumber;
            await pb.collection("mongo_users").update(record.id, data);
          }
          pb.authStore.clear();
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      try {
        if (ctx.path === "/sign-up/email") {
          if (!adminEmails.includes(ctx.body.email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Почтовый адрес не разрешен",
            });
          }
        }
      } catch (error) {
        console.error("Error in before hook:", error);
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: "Ошибка при обработке запроса",
        });
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [
    admin(),
    openAPI(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, request) => {
        // Implement sending OTP code via SMS

        if (!process.env.ENVIRONMENT || process.env.ENVIRONMENT === "dev") {
          console.log(`Sending OTP ${code} to phone number ${phoneNumber}`);
        }

        // await fetch("https://direct.i-dgtl.ru/api/v1/message", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${process.env.DIRECT_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     channelType: "TELEGRAM",
        //     senderName: "message_test_im_bot",
        //     destination: phoneNumber,
        //     content: {
        //       contentType: "text",
        //       text: `Ваш код подтверждения: ${code}`,
        //     },
        //   }),
        // });

        await fetch("https://direct.i-dgtl.ru/api/v1/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DIRECT_API_KEY}`,
          },
          body: JSON.stringify({
            channelType: "SMS",
            senderName: "sms_promo",
            destination: phoneNumber,
            content: `Ваш код подтверждения: ${code} (${process.env.DIRECT_COMPANY_NAME})`,
          }),
        });
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@rogain-moskva.ru`;
        },
      },
    }),
  ],
  rateLimit: {
    enabled: false,
  },

  // user: {
  //   deleteUser: {
  //     enabled: true,
  //   },
  // },
});
