import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { db } from "./firebaseService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ---------------- PAYMEE CONFIG ----------------
const PAYMEE_API_KEY = process.env.PAYMEE_API_KEY;
const PAYMEE_VENDOR = process.env.PAYMEE_VENDOR;
const PAYMEE_URL = "https://sandbox.paymee.tn/api/v1";

if (!PAYMEE_API_KEY || !PAYMEE_VENDOR) {
  console.error("❌ Missing PAYMEE_API_KEY or PAYMEE_VENDOR in .env");
  process.exit(1);
}

// ----------- SAFE JSON PARSER -----------
function safeParseJSON(text) { try { return JSON.parse(text); } catch { return null; } }

// -----------------------------------------------------
//                    1) CREATE PAYMENT
// -----------------------------------------------------
app.post("/api/payments/create", async (req, res) => {
  const { amount, courseId, userId } = req.body;
  if (!amount || !courseId || !userId)
    return res.status(400).json({ error: "Missing fields" });

  console.log("💡 Creating Paymee payment:", { amount, courseId, userId });

  try {
    const callbackUrl = `${process.env.BACKEND_URL}/api/payments/callback`;

    const response = await fetch(`${PAYMEE_URL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${PAYMEE_API_KEY}`,
      },
      body: JSON.stringify({
        vendor: Number(PAYMEE_VENDOR),
        amount: Number(amount),
        note: `Course:${courseId}`,

        // 🔥 IMPORTANT : localhost interdit, doit être un vrai domaine
        return_url: `${process.env.FRONTEND_URL}/payment-callback?courseId=${courseId}`,
        webhook_url: callbackUrl,
      }),
    });

    const text = await response.text();
    const data = safeParseJSON(text);

    if (!response.ok || !data?.data?.token)
      return res.status(400).json({ error: "Paymee error", details: text });

    const token = data.data.token;
    const paymentUrl = `https://sandbox.paymee.tn/gateway/${token}`;

    // SAVE IN FIRESTORE
    const docRef = await db.collection("payments").add({
      userId,
      courseId,
      amount,
      token,
      status: "pending",
      paymentUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("📌 Firestore payment saved:", docRef.id);

    res.json({
      status: "pending",
      token,
      paymentUrl,
    });
  } catch (err) {
    console.error("💥 Create payment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------
//                   2) CHECK PAYMENT STATUS
// -----------------------------------------------------
app.get("/api/payments/check/:token", async (req, res) => {
  const { token } = req.params;
  console.log("🔍 Checking payment status:", token);

  try {
    const request = await fetch(`${PAYMEE_URL}/payments/${token}/check`, {
      headers: { Authorization: `Token ${PAYMEE_API_KEY}` },
    });

    const text = await request.text();
    const data = safeParseJSON(text);

    if (!data?.data) return res.json({ status: "pending" });

    const isPaid = data.data.payment_status === true;

    // If paid → Update Firestore + Create purchase
    if (isPaid) {
      const ref = db.collection("payments").where("token", "==", token);
      const snap = await ref.get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const info = doc.data();

        await doc.ref.update({ status: "paid", updatedAt: new Date() });

        // Add purchase if not exists
        const buyRef = db.collection("purchases")
          .where("userId", "==", info.userId)
          .where("courseId", "==", info.courseId);

        const exists = await buyRef.get();

        if (exists.empty) {
          await db.collection("purchases").add({
            userId: info.userId,
            courseId: info.courseId,
            purchasedAt: new Date(),
          });
          console.log("🎉 Course unlocked for user:", info.userId);
        }

        return res.json({ status: "paid", courseId: info.courseId });
      }
    }

    res.json({ status: "pending" });

  } catch (err) {
    console.error("💥 Check error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// -----------------------------------------------------
//                      3) WEBHOOK CALLBACK
// -----------------------------------------------------
app.post("/api/payments/callback", async (req, res) => {
  console.log("📩 PAYMEE CALLBACK 🔔 :", req.body);

  try {
    const { token, payment_status } = req.body;
    if (!token) return res.status(400).send("Missing token");

    if (payment_status === true) {
      const ref = db.collection("payments").where("token", "==", token);
      const snap = await ref.get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();

        await doc.ref.update({ status: "paid", updatedAt: new Date() });

        // create purchase if not exists
        const existing = await db.collection("purchases")
          .where("userId", "==", data.userId)
          .where("courseId", "==", data.courseId)
          .get();

        if (existing.empty) {
          await db.collection("purchases").add({
            userId: data.userId,
            courseId: data.courseId,
            purchasedAt: new Date(),
          });
        }

        console.log("🔥 Purchase created automatically");
      }
    }

    res.status(200).send("OK");

  } catch (err) {
    console.error("⚠ CALLBACK ERROR :", err);
    res.status(500).send("Callback Error");
  }
});

// -----------------------------------------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
