// src/views/MainPage.jsx
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseService";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import PurchaseController from "../controllers/PurchaseController";

export default function MainPage() {
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [ownedCourses, setOwnedCourses] = useState([]);
  
  // État pour l'alerte de succès de paiement
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [purchasedCourseId, setPurchasedCourseId] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // ✅ Vérifier si on vient d'un paiement réussi
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      setShowSuccessAlert(true);
      setPurchasedCourseId(location.state.courseId);

      // Nettoyer le state pour éviter de réafficher l'alerte au refresh
      window.history.replaceState({}, document.title);

      // Masquer l'alerte après 8 secondes
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 8000);
    }
  }, [location.state]);

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

  // Fermer l'alerte
  const handleDismissAlert = () => {
    setShowSuccessAlert(false);
  };

  // Aller vers le cours acheté
  const handleGoToCourse = () => {
    if (purchasedCourseId) {
      navigate(`/lesson/${purchasedCourseId}`);
    }
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
      {/* ✅ Alerte de succès de paiement */}
      {showSuccessAlert && (
        <div className="success-alert-overlay">
          <motion.div 
            className="success-alert-card"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <button 
              className="alert-close-btn" 
              onClick={handleDismissAlert}
            >
              ×
            </button>

            <div className="alert-icon">
              <motion.div 
                className="checkmark-circle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <motion.div 
                  className="checkmark"
                  initial={{ height: 0 }}
                  animate={{ height: 50 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                />
              </motion.div>
            </div>

            <h2 className="alert-title">🎉 Paiement confirmé !</h2>
            
            <div className="alert-content">
              <p className="alert-main-text">
                Votre paiement a été effectué avec succès.
              </p>
              
              <motion.div 
                className="alert-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="detail-badge">
                  <span className="badge-icon">📧</span>
                  <span className="badge-text">Email de confirmation envoyé</span>
                </div>
                <div className="detail-badge">
                  <span className="badge-icon">🎓</span>
                  <span className="badge-text">Cours débloqué et accessible</span>
                </div>
              </motion.div>

              <p className="alert-sub-text">
                Un email récapitulatif vous a été envoyé avec tous les détails de votre achat.
              </p>
            </div>

            <motion.div 
              className="alert-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {purchasedCourseId && (
                <button 
                  className="btn-primary-alert" 
                  onClick={handleGoToCourse}
                >
                  Accéder au cours →
                </button>
              )}
              <button 
                className="btn-secondary-alert" 
                onClick={handleDismissAlert}
              >
                Continuer
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}

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

      <style jsx>{`
        .success-alert-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .success-alert-card {
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          max-width: 500px;
          width: 100%;
          position: relative;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .alert-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #f3f4f6;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-close-btn:hover {
          background: #e5e7eb;
          color: #374151;
          transform: rotate(90deg);
        }

        .alert-icon {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .checkmark-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkmark {
          width: 30px;
          height: 50px;
          border: solid white;
          border-width: 0 5px 5px 0;
          transform: rotate(45deg);
        }

        .alert-title {
          font-size: 1.75rem;
          font-weight: bold;
          text-align: center;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .alert-content {
          text-align: center;
        }

        .alert-main-text {
          font-size: 1.1rem;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        .alert-details {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .detail-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .detail-badge:last-child {
          margin-bottom: 0;
        }

        .badge-icon {
          font-size: 1.5rem;
        }

        .badge-text {
          color: #374151;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .alert-sub-text {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 1rem;
        }

        .alert-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 2rem;
        }

        .btn-primary-alert,
        .btn-secondary-alert {
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary-alert {
          background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
          color: white;
        }

        .btn-primary-alert:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
        }

        .btn-secondary-alert {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary-alert:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .success-alert-card {
            padding: 2rem 1.5rem;
          }

          .alert-title {
            font-size: 1.5rem;
          }

          .checkmark-circle {
            width: 70px;
            height: 70px;
          }

          .checkmark {
            width: 25px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}