import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { admin, phoneNumber } from "better-auth/plugins";
import { openAPI } from "better-auth/plugins";

import { MongoClient } from "mongodb";

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
      sendOTP: ({ phoneNumber, code }, request) => {
        // Implement sending OTP code via SMS
        console.log(`Sending OTP ${code} to phone number ${phoneNumber}`);
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
