import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { db } from "./firebaseService.js";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ---------------- PAYMEE CONFIG ----------------
const PAYMEE_API_KEY = process.env.PAYMEE_API_KEY;
const PAYMEE_VENDOR = process.env.PAYMEE_VENDOR;
const PAYMEE_URL = "https://sandbox.paymee.tn/api/v1";

// ⚠️ MODE DÉVELOPPEMENT : Auto-valider les paiements
const DEV_MODE = process.env.DEV_MODE === "true"; // Mettre à false en production

if (!PAYMEE_API_KEY || !PAYMEE_VENDOR) {
  console.error("❌ Missing PAYMEE_API_KEY or PAYMEE_VENDOR in .env");
  process.exit(1);
}

console.log(`🔧 Mode: ${DEV_MODE ? "DÉVELOPPEMENT (paiements auto-validés)" : "PRODUCTION"}`);

// ---------------- EMAIL CONFIG ----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send confirmation email
async function sendConfirmationEmail(userEmail, userName, courseName, amount) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "✅ Confirmation de votre achat - " + courseName,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">🎉 Paiement confirmé !</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Merci pour votre achat ! Votre paiement a été confirmé avec succès.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Détails de votre achat :</h3>
          <p><strong>Cours :</strong> ${courseName}</p>
          <p><strong>Montant :</strong> ${amount} TND</p>
          <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        <p>Vous pouvez maintenant accéder à votre cours depuis votre espace étudiant.</p>
        <a href="${process.env.FRONTEND_URL}/student/courses" 
           style="display: inline-block; background-color: #4CAF50; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Accéder à mes cours
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("❌ Email error:", error);
    return false;
  }
}

// ----------- SAFE JSON PARSER -----------
function safeParseJSON(text) { 
  try { 
    return JSON.parse(text); 
  } catch { 
    return null; 
  } 
}

// ----------- AUTO-VALIDATE PAYMENT (DEV MODE) -----------
async function autoValidatePayment(token, userId, courseId, amount) {
  console.log("🤖 Auto-validation du paiement en mode DEV...");
  
  try {
    // 1. Mettre à jour le statut du paiement
    const paymentRef = db.collection("payments").where("token", "==", token);
    const paymentSnap = await paymentRef.get();
    
    if (paymentSnap.empty) {
      console.error("❌ Payment not found");
      return false;
    }
    
    const paymentDoc = paymentSnap.docs[0];
    await paymentDoc.ref.update({ 
      status: "paid", 
      updatedAt: new Date(),
      autoValidated: true // Flag pour indiquer que c'est auto-validé
    });
    
    console.log("✅ Payment status updated to 'paid'");
    
    // 2. Créer l'achat
    const existingPurchase = await db.collection("purchases")
      .where("userId", "==", userId)
      .where("courseId", "==", courseId)
      .get();
    
    if (existingPurchase.empty) {
      await db.collection("purchases").add({
        userId,
        courseId,
        purchasedAt: new Date(),
      });
      console.log("✅ Purchase created");
    }
    
    // 3. Récupérer les infos pour l'email
    const userDoc = await db.collection("users").doc(userId).get();
    const courseDoc = await db.collection("courses").doc(courseId).get();
    
    if (userDoc.exists && courseDoc.exists) {
      const userData = userDoc.data();
      const courseData = courseDoc.data();
      
      await sendConfirmationEmail(
        userData.email,
        userData.name || userData.email,
        courseData.title || "Cours",
        amount
      );
      console.log("✅ Confirmation email sent");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Auto-validation error:", error);
    return false;
  }
}

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
    const returnUrl = `${process.env.FRONTEND_URL}/payment-callback`;

    console.log("🔗 Callback URL:", callbackUrl);
    console.log("🔗 Return URL:", returnUrl);

    const response = await fetch(`${PAYMEE_URL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${PAYMEE_API_KEY}`,
      },
      body: JSON.stringify({
        vendor: Number(PAYMEE_VENDOR),
        amount: Number(amount) * 1000, // Paymee utilise les millimes
        note: `Course:${courseId}|User:${userId}`,
        first_name: "Student",
        last_name: "User",
        email: "student@example.com",
        phone: "21600000000",
        return_url: returnUrl,
        cancel_url: returnUrl,
        webhook_url: callbackUrl,
      }),
    });

    const text = await response.text();
    console.log("📥 Paymee Response:", text);

    const data = safeParseJSON(text);

    if (!response.ok || !data?.data?.token) {
      console.error("❌ Paymee error:", text);
      return res.status(400).json({ 
        error: "Erreur Paymee", 
        details: data?.detail || text 
      });
    }

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
    console.log("🔗 Payment URL:", paymentUrl);

    // ⚠️ MODE DEV : Auto-valider le paiement immédiatement
    if (DEV_MODE) {
      console.log("⚡ Mode DEV activé - Auto-validation dans 2 secondes...");
      
      // Attendre 2 secondes pour simuler un délai réaliste
      setTimeout(async () => {
        await autoValidatePayment(token, userId, courseId, amount);
      }, 2000);
      
      return res.json({
        status: "auto_validated",
        token,
        message: "Paiement auto-validé en mode développement",
        courseId,
      });
    }

    // Mode production normal
    res.json({
      status: "pending",
      token,
      paymentUrl,
    });
    
  } catch (err) {
    console.error("💥 Create payment error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// -----------------------------------------------------
//                   2) CHECK PAYMENT STATUS
// -----------------------------------------------------
app.get("/api/payments/check/:token", async (req, res) => {
  const { token } = req.params;
  console.log("🔍 Checking payment status for token:", token);

  try {
    // Vérifier d'abord dans Firestore
    const ref = db.collection("payments").where("token", "==", token);
    const snap = await ref.get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      const info = doc.data();
      
      if (info.status === "paid") {
        console.log("✅ Payment already marked as paid in Firestore");
        return res.json({ status: "paid", courseId: info.courseId });
      }
    }

    // En mode DEV, ne pas appeler l'API Paymee
    if (DEV_MODE) {
      return res.json({ status: "pending" });
    }

    // Mode production : vérifier avec l'API Paymee
    const request = await fetch(`${PAYMEE_URL}/payments/${token}/check`, {
      headers: { Authorization: `Token ${PAYMEE_API_KEY}` },
    });

    const text = await request.text();
    const data = safeParseJSON(text);

    console.log("📊 Payment check response:", data);

    if (!data?.data) {
      return res.json({ status: "pending" });
    }

    const isPaid = data.data.payment_status === true;

    if (isPaid && !snap.empty) {
      const doc = snap.docs[0];
      const info = doc.data();

      await doc.ref.update({ status: "paid", updatedAt: new Date() });
      console.log("✅ Payment status updated to paid");

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

        // Send email
        try {
          const userDoc = await db.collection("users").doc(info.userId).get();
          const courseDoc = await db.collection("courses").doc(info.courseId).get();

          if (userDoc.exists && courseDoc.exists) {
            const userData = userDoc.data();
            const courseData = courseDoc.data();

            await sendConfirmationEmail(
              userData.email,
              userData.name || userData.email,
              courseData.title || "Cours",
              info.amount
            );
          }
        } catch (emailError) {
          console.error("⚠️ Email error (non-blocking):", emailError);
        }
      }

      return res.json({ status: "paid", courseId: info.courseId });
    }

    res.json({ status: "pending" });

  } catch (err) {
    console.error("💥 Check error:", err);
    res.status(500).json({ error: "Internal error", details: err.message });
  }
});

// -----------------------------------------------------
//                      3) WEBHOOK CALLBACK
// -----------------------------------------------------
app.post("/api/payments/callback", async (req, res) => {
  console.log("📩 PAYMEE CALLBACK 🔔");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  try {
    const { token, payment_status } = req.body;
    
    if (!token) {
      console.warn("⚠️ Callback without token");
      return res.status(400).send("Missing token");
    }

    console.log(`📌 Token: ${token}, Status: ${payment_status}`);

    if (payment_status === true) {
      const ref = db.collection("payments").where("token", "==", token);
      const snap = await ref.get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();

        if (data.status === "paid") {
          console.log("✅ Payment already processed");
          return res.status(200).send("Already processed");
        }

        await doc.ref.update({ status: "paid", updatedAt: new Date() });
        console.log("✅ Payment marked as paid");

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
          console.log("🔥 Purchase created");

          try {
            const userDoc = await db.collection("users").doc(data.userId).get();
            const courseDoc = await db.collection("courses").doc(data.courseId).get();

            if (userDoc.exists && courseDoc.exists) {
              const userData = userDoc.data();
              const courseData = courseDoc.data();

              await sendConfirmationEmail(
                userData.email,
                userData.name || userData.email,
                courseData.title || "Cours",
                data.amount
              );
              console.log("📧 Confirmation email sent");
            }
          } catch (emailError) {
            console.error("⚠️ Email error (non-blocking):", emailError);
          }
        }
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