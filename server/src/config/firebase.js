import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let firebaseApp = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (projectId && clientEmail && privateKey) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("✓ Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("⚠️ Firebase Admin credentials not fully specified in .env. Running without Admin SDK.");
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error.message);
}

export const auth = admin.auth();
export default firebaseApp;
