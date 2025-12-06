import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, app } from "./firebaseService";

const auth = getAuth(app);

// Signup
export async function signUp(email, password, name, isAdmin = false) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Email de vérification
  await sendEmailVerification(user);

  // Création document Firestore
  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    isAdmin,
    createdAt: new Date(),
    updatedAt: null,
  });

  return user;
}

// Login
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// Logout
export async function logout() {
  await signOut(auth);
}

// Mot de passe oublié / réinitialisation
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  alert(`Email de réinitialisation envoyé à ${email}`);
}
