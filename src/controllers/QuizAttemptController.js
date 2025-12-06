// src/controllers/QuizAttemptController.js
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebaseService";

/**
 * Structure de la collection quizAttempts :
 * {
 *   quizId,
 *   userId,
 *   quizTitle, // optionnel mais pratique pour l'historique
 *   answers: [ { questionId, selectedIndex } ],
 *   score: number (0..100),
 *   passed: boolean,
 *   createdAt: Timestamp
 * }
 */
export default class QuizAttemptController {
  constructor() {
    this.collectionRef = collection(db, "quizAttempts");
    this.listeners = [];
  }

  // 🔹 Ajouter une tentative
  async addAttempt({
    quizId,
    userId,
    quizTitle = "",
    answers = [],
    score = 0,
    passed = false,
  }) {
    const payload = {
      quizId,
      userId,
      quizTitle,
      answers,
      score,
      passed,
      createdAt: new Date(), // Firestore convertira en Timestamp automatiquement
    };
    const docRef = await addDoc(this.collectionRef, payload);
    return { id: docRef.id, ...payload };
  }

  // 🔹 Compter le nombre de tentatives d'un utilisateur sur un quiz
  async countAttemptsForUser(quizId, userId) {
    const q = query(
      this.collectionRef,
      where("quizId", "==", quizId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  // 🔹 Récupérer toutes les tentatives d'un utilisateur pour un quiz (une seule fois)
  async fetchAttemptsForQuizByUser(quizId, userId) {
    const q = query(
      this.collectionRef,
      where("quizId", "==", quizId),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // 🔹 Récupérer toutes les tentatives d'un utilisateur (tous les quizzes)
  async fetchAllAttemptsForUser(userId) {
    const q = query(
      this.collectionRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // 🔹 Écouter les tentatives pour un quiz (admin view)
  listenAttemptsForQuiz(quizId, callback) {
    const q = query(
      this.collectionRef,
      where("quizId", "==", quizId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attempts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(attempts);
    });
    this.listeners.push(unsubscribe);
    return () => {
      unsubscribe();
      this.listeners = this.listeners.filter((u) => u !== unsubscribe);
    };
  }
}
