// src/views/MainPage.jsx
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PurchaseController from "../controllers/PurchaseController";

export default function MainPage() {
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [ownedCourses, setOwnedCourses] = useState([]);
  const auth = getAuth();
  const navigate = useNavigate();
  const purchaseCtrl = new PurchaseController();

  // Load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Load all courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      const coursesCol = collection(db, "courses");
      const courseSnapshot = await getDocs(coursesCol);

      const courseList = courseSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCourses(courseList);
    };

    fetchCourses();
  }, []);

  // Check ownership for all courses
  useEffect(() => {
    const checkOwnership = async () => {
      if (!user || courses.length === 0) return;

      const owned = [];
      for (const course of courses) {
        const hasAccess = await purchaseCtrl.userOwnsCourse(user.uid, course.id);
        if (hasAccess) {
          owned.push(course.id);
        }
      }
      setOwnedCourses(owned);
    };

    checkOwnership();
  }, [user, courses]);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user || !userData)
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );

  // Filter courses for students (only published)
  const visibleCourses = userData.isAdmin
    ? courses
    : courses.filter((c) => c.isPublished === true);

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <h1 className="page-title">
            Bienvenue, {userData.name} 👋
          </h1>
          <p className="course-info">
            Rôle: <span className="font-semibold badge badge-role">
              {userData.isAdmin ? "👨‍💼 Administrateur" : "👨‍🎓 Étudiant"}
            </span>
          </p>
        </motion.div>

        {userData.isAdmin && (
          <div className="admin-actions mb-6">
            <button className="btn btn-add" onClick={() => navigate("/users")}>
              👥 Gérer les utilisateurs
            </button>
            <button className="btn btn-edit" onClick={() => navigate("/admin/courses")}>
              📚 Gestion des cours
            </button>
          </div>
        )}

        <div className="courses-section">
          <h2 className="section-title">
            📚 Catalogue des cours ({visibleCourses.length})
          </h2>
          
          <div className="lessons-grid">
            {visibleCourses.map((course) => {
              const isOwned = ownedCourses.includes(course.id);
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="course-card-modern"
                >
                  <div className="course-header">
                    <h3 className="lesson-title">{course.title}</h3>
                    {!course.isPublished && (
                      <span className="badge badge-draft">Brouillon</span>
                    )}
                    {!userData.isAdmin && isOwned && (
                      <span className="badge badge-preview">✓ Acheté</span>
                    )}
                    {!userData.isAdmin && !isOwned && (
                      <span className="badge badge-locked">🔒</span>
                    )}
                  </div>
                  
                  <p className="lesson-type">{course.description}</p>
                  <p className="course-price-tag">{course.price} TND</p>

                  <div className="course-actions-grid">
                    {userData.isAdmin ? (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/lessons/${course.id}`)}
                        >
                          📝 Leçons
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/quizzes/${course.id}`)}
                        >
                          ❓ Quizzes
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/lesson/${course.id}`)}
                        >
                          📖 Leçons
                        </button>
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={() => navigate(`/quizzes/${course.id}`)}
                        >
                          🎯 Quizzes
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-footer">
          <button className="btn btn-delete" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}