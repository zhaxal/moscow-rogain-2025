import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { admin, phoneNumber } from "better-auth/plugins";
import { openAPI } from "better-auth/plugins";

import { Pool } from "pg";

const adminEmails = ["zhaxa65@gmail.com"];

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

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

        // await fetch("https://direct.i-dgtl.ru/api/v1/message", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${process.env.DIRECT_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     channelType: "SMS",
        //     senderName: "sms_promo",
        //     destination: phoneNumber,
        //     content: `Ваш код подтверждения: ${code} (${process.env.DIRECT_COMPANY_NAME})`,
        //   }),
        // });
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
