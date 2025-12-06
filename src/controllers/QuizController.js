// src/controllers/QuizController.js
import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebaseService";
import Quiz from "../models/Quiz";

/**
 * QuizController
 * - quizzes stored in collection "quizzes"
 * - questions embedded as array inside quiz doc
 */
export default class QuizController {
  constructor() {
    this.collectionRef = collection(db, "quizzes");
    this.listeners = [];
  }

  // Listen quizzes for a given courseId in real-time
  listenQuizzesForCourse(courseId, callback) {
    const q = query(
      this.collectionRef,
      where("courseId", "==", courseId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizzes = snapshot.docs.map(
        (d) => new Quiz({ id: d.id, ...d.data() })
      );
      callback(quizzes);
    });
    this.listeners.push(unsubscribe);
    return () => {
      unsubscribe();
      this.listeners = this.listeners.filter((u) => u !== unsubscribe);
    };
  }

  // Get a quiz by id (one-time fetch)
  async getQuizById(quizId) {
    const ref = doc(db, "quizzes", quizId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return new Quiz({ id: snap.id, ...snap.data() });
  }

  // Add a quiz
  async addQuiz({
    courseId,
    title,
    description,
    questions = [],
    passScore = 70,
    maxAttempts = 3,
  }) {
    // Ensure each question has an id and minimal fields
    const normalized = (questions || []).map((q) => ({
      id: q.id || uuidv4(),
      text: q.text || "",
      choices: q.choices || [],
      correctAnswerIndex:
        typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
      explanation: q.explanation || "",
    }));

    const payload = {
      courseId,
      title,
      description,
      questions: normalized,
      passScore,
      maxAttempts: maxAttempts == null ? null : Number(maxAttempts),
      createdAt: new Date(),
      updatedAt: null,
    };

    const docRef = await addDoc(this.collectionRef, payload);
    return new Quiz({ id: docRef.id, ...payload });
  }

  // Update a quiz (replace entire questions array if provided)
  async updateQuiz(
    quizId,
    { title, description, questions, passScore, maxAttempts }
  ) {
    const ref = doc(db, "quizzes", quizId);
    const updatePayload = {
      updatedAt: new Date(),
    };
    if (typeof title !== "undefined") updatePayload.title = title;
    if (typeof description !== "undefined")
      updatePayload.description = description;
    if (typeof passScore !== "undefined")
      updatePayload.passScore = Number(passScore);
    if (typeof maxAttempts !== "undefined")
      updatePayload.maxAttempts =
        maxAttempts == null ? null : Number(maxAttempts);
    if (Array.isArray(questions)) {
      // ensure ids for questions
      updatePayload.questions = questions.map((q) => ({
        id: q.id || uuidv4(),
        text: q.text || "",
        choices: q.choices || [],
        correctAnswerIndex:
          typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        explanation: q.explanation || "",
      }));
    }
    await updateDoc(ref, updatePayload);
    const snap = await getDoc(ref);
    return new Quiz({ id: snap.id, ...snap.data() });
  }

  // Delete a quiz
  async deleteQuiz(quizId) {
    const ref = doc(db, "quizzes", quizId);
    await deleteDoc(ref);
  }

  // Helper: quick fetch quizzes for course (one-time)
  async fetchQuizzesForCourse(courseId) {
    const q = query(
      this.collectionRef,
      where("courseId", "==", courseId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => new Quiz({ id: d.id, ...d.data() }));
  }
}
