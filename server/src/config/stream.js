import { StreamChat } from "stream-chat";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.warn("⚠️ Stream Chat API key or secret missing from environment variables.");
}

export const streamServerClient = apiKey && apiSecret
  ? StreamChat.getInstance(apiKey, apiSecret)
  : null;

export async function upsertStreamUser(user) {
  if (!streamServerClient || !user || !user.id) return null;
  const userData = {
    id: user.id,
    name: user.name || "TerraMatch User",
    role: "user", // Stream chat user-level role
    customRole: user.role || "CLIENT",
    email: user.email || undefined,
  };
  if (user.avatarUrl) {
    userData.image = user.avatarUrl;
  }
  await streamServerClient.upsertUser(userData);
  return userData;
}

export function createStreamToken(userId) {
  if (!streamServerClient || !userId) return null;
  return streamServerClient.createToken(userId);
}
