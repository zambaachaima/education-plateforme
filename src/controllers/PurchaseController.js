import { db } from "../services/firebaseService";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export default class PurchaseController {
  constructor() {
    this.collectionRef = collection(db, "purchases");
  }

  // Vérifier si l'utilisateur possède le cours
  async userOwnsCourse(userId, courseId) {
    try {
      const q = query(
        this.collectionRef,
        where("userId", "==", userId),
        where("courseId", "==", courseId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    } catch (err) {
      console.error("❌ userOwnsCourse error:", err);
      return false;
    }
  }

  // Créer un achat
  async createPurchase(userId, courseId) {
    try {
      const existing = await this.userOwnsCourse(userId, courseId);
      if (existing) return { id: existing.id, alreadyExists: true };

      const docRef = await addDoc(this.collectionRef, {
        userId,
        courseId,
        purchasedAt: serverTimestamp(),
        createdAt: new Date(),
      });
      return { id: docRef.id, alreadyExists: false };
    } catch (err) {
      console.error("❌ createPurchase error:", err);
      throw err;
    }
  }

  // Récupérer tous les achats d'un utilisateur
  async getUserPurchases(userId) {
    try {
      const q = query(this.collectionRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("❌ getUserPurchases error:", err);
      throw err;
    }
  }
}
