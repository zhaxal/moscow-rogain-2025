import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { admin, phoneNumber } from "better-auth/plugins";
import { openAPI, anonymous } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);
const db = client.db();

const adminEmails = ["zhaxa65@gmail.com"];

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [admin(), openAPI()],
  rateLimit: {
    enabled: false,
  },

  user: {
    deleteUser: {
      enabled: true,
    },
  },
});
