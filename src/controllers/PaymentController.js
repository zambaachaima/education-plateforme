import { db } from "../services/firebaseService";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default class PaymentController {
  constructor() {
    this.collectionRef = collection(db, "payments");
  }

  // 🔹 Démarrer le paiement (via backend)
  async startPayment(amount, courseId, userId) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, courseId, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment creation failed");
      }

      console.log("✅ Payment created:", data);
      return data;
    } catch (err) {
      console.error("❌ startPayment error:", err);
      throw err;
    }
  }

  // 🔹 Vérifier le paiement et mettre à jour Firestore
  async verifyPayment(token) {
    try {
      console.log("🔍 Verifying payment:", token);

      // Appeler le backend pour vérifier le statut
      const res = await fetch(`${BACKEND_URL}/api/payments/${token}/check`);
      
      if (!res.ok) {
        throw new Error("Failed to check payment status");
      }

      const data = await res.json();
      
      console.log("💡 Payment check result:", data);

      if (data.status === "paid") {
        return {
          success: true,
          status: "paid",
          courseId: data.courseId,
          userId: data.userId,
        };
      }

      return {
        success: false,
        status: data.status || "pending",
      };

    } catch (err) {
      console.error("❌ verifyPayment error:", err);
      return { 
        success: false, 
        error: err.message,
        status: "error"
      };
    }
  }

  // 🔹 Récupérer tous les paiements d'un utilisateur
  async getUserPayments(userId) {
    try {
      const q = query(this.collectionRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error("❌ getUserPayments error:", err);
      throw err;
    }
  }
}