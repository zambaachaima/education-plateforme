import admin from "firebase-admin";
import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);

// Charger le service account
let serviceAccount;
try {
  // Essayer de charger depuis le fichier JSON
  serviceAccount = require("./serviceAccountKey.json");
} catch (error) {
  console.error("❌ Erreur lors du chargement de serviceAccountKey.json:", error.message);
  console.log("💡 Assurez-vous que le fichier serviceAccountKey.json existe dans le dossier backend");
  process.exit(1);
}

// Vérifier que Firebase Admin n'est pas déjà initialisé
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Optionnel: spécifier l'URL de la base de données si vous utilisez Realtime Database
      // databaseURL: "https://your-project-id.firebaseio.com"
    });
    console.log("✅ Firebase Admin initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de Firebase Admin:", error.message);
    process.exit(1);
  }
} else {
  console.log("ℹ️ Firebase Admin déjà initialisé");
}

const db = admin.firestore();

// Vérifier la connexion à Firestore
db.collection("_healthcheck")
  .limit(1)
  .get()
  .then(() => {
    console.log("✅ Connexion à Firestore établie");
  })
  .catch((error) => {
    console.error("❌ Erreur de connexion à Firestore:", error.message);
    console.log("💡 Vérifiez que:");
    console.log("   1. Le fichier serviceAccountKey.json est valide");
    console.log("   2. Le compte de service a les bonnes permissions");
    console.log("   3. Firestore est activé dans votre projet Firebase");
  });

export { db, admin };