// controllers/CourseController.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebaseService";
import Course from "../models/Course";

export default class CourseController {
  async getAllCourses() {
    const snap = await getDocs(collection(db, "courses"));
    return snap.docs.map(
      (d) =>
        new Course(
          d.id,
          d.data().title,
          d.data().price,
          d.data().description,
          d.data().isPublished
        )
    );
  }

  async addCourse(title, price, description, isPublished = false) {
    const docRef = await addDoc(collection(db, "courses"), {
      title,
      price,
      description,
      isPublished,
    });
    return new Course(docRef.id, title, price, description, isPublished);
  }

  async updateCourse(id, data) {
    const courseRef = doc(db, "courses", id);
    await updateDoc(courseRef, data);
  }

  async deleteCourse(id) {
    const courseRef = doc(db, "courses", id);
    await deleteDoc(courseRef);
  }

  async getCourse(id) {
    const ref = doc(db, "courses", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return new Course(
      id,
      data.title,
      data.price,
      data.description,
      data.isPublished
    );
  }
  listenCourses(callback) {
    const coursesRef = collection(db, "courses");
    return onSnapshot(coursesRef, (snapshot) => {
      const courses = snapshot.docs.map(
        (d) =>
          new Course(
            d.id,
            d.data().title,
            d.data().price,
            d.data().description,
            d.data().isPublished
          )
      );
      callback(courses);
    });
  }
}
