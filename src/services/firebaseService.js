// src/services/firebaseService.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth } from "firebase/auth";

// 🔑 Configuration Firebase depuis .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialise Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // 🔹 export Storage
export const auth = getAuth(app);

// --- Firestore CRUD (users) ---
export async function getAllUsersFromDB() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    };
  });
}

export async function addUserToDB(user) {
  const refCol = collection(db, "users");
  const docRef = await addDoc(refCol, {
    ...user,
    createdAt: new Date(),
    updatedAt: null,
  });
  return docRef.id;
}

export async function deleteUserFromDB(userId) {
  const userRef = doc(db, "users", String(userId));
  await deleteDoc(userRef);
}

export async function updateUserInDB(userId, updatedData) {
  const userRef = doc(db, "users", String(userId));
  await updateDoc(userRef, { ...updatedData, updatedAt: new Date() });
}

export async function getUserById(userId) {
  const userRef = doc(db, "users", String(userId));
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
  };
}

export function listenToUsers(callback) {
  const usersRef = collection(db, "users");
  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      };
    });
    callback(users);
  });
}

// --- Firebase Storage helper functions ---
export async function uploadFile(file, folder = "lessons") {
  if (!file) return null;

  const fileRef = ref(storage, `${folder}/${file.name}_${Date.now()}`);
  await uploadBytes(fileRef, file);
  const fileUrl = await getDownloadURL(fileRef);
  return { fileUrl, fileName: file.name };
}

export async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  const fileRef = ref(storage, fileUrl);
  await deleteObject(fileRef);
}
