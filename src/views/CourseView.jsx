// src/views/CourseView.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import CourseController from "../controllers/CourseController";
import PurchaseController from "../controllers/PurchaseController";

export default function CourseView() {
  const controller = new CourseController();
  const purchaseCtrl = new PurchaseController();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [courses, setCourses] = useState([]);
  const [ownedCourses, setOwnedCourses] = useState([]);

  useEffect(() => {
    const unsubscribe = controller.listenCourses(setCourses);
    return () => unsubscribe();
  }, []);

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

  // ✅ CORRECTION: Rediriger vers la page de paiement au lieu d'appeler l'API
  const handleBuyCourse = (course) => {
    if (!user) {
      alert("Veuillez vous connecter");
      navigate("/");
      return;
    }

    // Rediriger vers la page de paiement avec le courseId
    navigate(`/payment?courseId=${course.id}`);
  };

  // Only show published courses
  const visibleCourses = courses.filter(c => c.isPublished === true);

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-back">
            ← Retour
          </button>
          <h1 className="page-title">Catalogue des cours</h1>
        </div>

        <p className="course-info">
          {visibleCourses.length} cours disponible{visibleCourses.length > 1 ? "s" : ""}
        </p>

        <div className="lessons-grid">
          {visibleCourses.map(course => {
            const isOwned = ownedCourses.includes(course.id);
            
            return (
              <div 
                key={course.id} 
                className={`course-card-modern ${!isOwned ? 'lesson-locked' : ''}`}
              >
                <div className="course-header">
                  <h3 className="lesson-title">{course.title}</h3>
                  {isOwned ? (
                    <span className="badge badge-preview">✓ Acheté</span>
                  ) : (
                    <span className="badge badge-locked">🔒 Verrouillé</span>
                  )}
                </div>

                <p className="lesson-type">{course.description}</p>
                <p className="course-price-tag">{course.price} TND</p>

                <div className="course-actions-grid">
                  {isOwned ? (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/lesson/${course.id}`)}
                      >
                        📖 Voir les leçons
                      </button>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => navigate(`/quizzes/${course.id}`)}
                      >
                        🎯 Voir les quizzes
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm w-full"
                      onClick={() => handleBuyCourse(course)}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      🛒 Acheter ce cours
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}