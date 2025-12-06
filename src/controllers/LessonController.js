import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabaseClient";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebaseService";
import Lesson from "../models/Lesson";

export default class LessonController {
  constructor(courseId) {
    this.courseId = courseId;
    this.listeners = [];
  }

  // Écoute les leçons pour ce cours
  listenLessons(callback) {
    const lessonsCol = collection(db, "lessons");
    const unsubscribe = onSnapshot(lessonsCol, (snapshot) => {
      const allLessons = snapshot.docs.map(
        (doc) => new Lesson({ id: doc.id, ...doc.data() })
      );

      // Filtre selon courseId
      const filtered = allLessons.filter(
        (lesson) => String(lesson.courseId) === String(this.courseId)
      );

      callback(filtered);
    });

    this.listeners.push(unsubscribe);

    return () => {
      this.listeners.forEach((fn) => fn());
      this.listeners = [];
    };
  }

  // Ajouter une leçon
  async addLesson(courseId, title, type, preview = false, file) {
    let fileUrl = null;
    let fileName = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const supaFileName = `${uuidv4()}.${ext}`;

      const { error } = await supabase.storage
        .from("lessons")
        .upload(supaFileName, file);

      if (error) throw new Error("Échec du téléchargement : " + error.message);

      const { data } = supabase.storage
        .from("lessons")
        .getPublicUrl(supaFileName);
      fileUrl = data.publicUrl;
      fileName = file.name;
    }

    const docRef = await addDoc(collection(db, "lessons"), {
      courseId,
      title,
      type,
      preview, // false par défaut si admin ne coche pas
      fileUrl,
      fileName,
      createdAt: new Date(),
      updatedAt: null,
    });

    return new Lesson({
      id: docRef.id,
      courseId,
      title,
      type,
      preview,
      fileUrl,
      fileName,
    });
  }

  // Mettre à jour une leçon
  async updateLesson(id, { title, type, preview }, file) {
    const lessonRef = doc(db, "lessons", id);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) throw new Error("Leçon introuvable");

    const lessonData = lessonSnap.data();
    let fileUrl = lessonData.fileUrl;
    let fileName = lessonData.fileName;

    if (file) {
      if (fileUrl) {
        const oldFileName = fileUrl.split("/").pop();
        await supabase.storage.from("lessons").remove([oldFileName]);
      }

      const ext = file.name.split(".").pop();
      const supaFileName = `${uuidv4()}.${ext}`;
      const { error } = await supabase.storage
        .from("lessons")
        .upload(supaFileName, file);

      if (error) throw new Error("Échec du téléchargement : " + error.message);

      const { data } = supabase.storage
        .from("lessons")
        .getPublicUrl(supaFileName);
      fileUrl = data.publicUrl;
      fileName = file.name;
    }

    const updatedData = {
      title,
      type,
      preview,
      fileUrl,
      fileName,
      updatedAt: new Date(),
    };

    await updateDoc(lessonRef, updatedData);

    return new Lesson({ id, courseId: lessonData.courseId, ...updatedData });
  }

  // Supprimer une leçon
  async deleteLesson(id) {
    const lessonRef = doc(db, "lessons", id);
    const lessonSnap = await getDoc(lessonRef);

    if (!lessonSnap.exists()) return;

    const lessonData = lessonSnap.data();

    if (lessonData.fileUrl) {
      const oldFileName = lessonData.fileUrl.split("/").pop();
      await supabase.storage.from("lessons").remove([oldFileName]);
    }

    await deleteDoc(lessonRef);
  }
}
