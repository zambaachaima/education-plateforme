import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import QuizController from "../controllers/QuizController";
import PurchaseController from "../controllers/PurchaseController";

const quizCtrl = new QuizController();
const purchaseCtrl = new PurchaseController();

export default function QuizListView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [quizzes, setQuizzes] = useState([]);
  const [owns, setOwns] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const checkOwnership = async () => {
      const hasAccess = await purchaseCtrl.userOwnsCourse(user.uid, courseId);
      setOwns(hasAccess);
      setLoading(false);
    };

    checkOwnership();
  }, [user, courseId]);

  useEffect(() => {
    if (!courseId) return;
    const unsub = quizCtrl.listenQuizzesForCourse(courseId, setQuizzes);
    return () => unsub && unsub();
  }, [courseId]);

  const handleBuyCourse = () => {
    if (!user) {
      alert("Veuillez vous connecter");
      navigate("/");
      return;
    }

    // Rediriger vers la page de paiement
    navigate(`/payment?courseId=${courseId}`);
  };

  const handleQuizClick = (quizId) => {
    if (owns) {
      navigate(`/quiz/${quizId}`);
    } else {
      if (confirm("Vous devez acheter ce cours pour accéder aux quizzes. Voulez-vous procéder au paiement ?")) {
        handleBuyCourse();
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div className="page-container">
        <div className="admin-lesson-wrapper">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="btn btn-back">
              ← Retour
            </button>
            <h1 className="page-title">Quizzes du cours</h1>
          </div>
          <p className="text-center text-gray-600">Aucun quiz disponible pour ce cours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-back">
            ← Retour
          </button>
          <h1 className="page-title">Quizzes du cours</h1>
        </div>

        {!owns && (
          <div className="alert alert-warning mb-4">
            ⚠️ Vous devez acheter ce cours pour accéder aux quizzes.
            <button onClick={handleBuyCourse} className="btn btn-primary ml-4">
              🛒 Acheter ce cours
            </button>
          </div>
        )}

        <p className="course-info">
          {quizzes.length} quiz{quizzes.length > 1 ? "s" : ""} disponible{quizzes.length > 1 ? "s" : ""}
        </p>

        <div className="lessons-grid">
          {quizzes.map((q) => (
            <div 
              key={q.id} 
              className={`lesson-card ${!owns ? 'lesson-locked' : ''}`}
              onClick={() => owns && handleQuizClick(q.id)}
              style={{ cursor: owns ? 'pointer' : 'default' }}
            >
              <div className="flex justify-between items-start">
                <div className="lesson-title">{q.title}</div>
                {!owns && <span className="badge badge-locked">🔒</span>}
              </div>
              
              <div className="lesson-type">{q.description}</div>
              <div className="lesson-status text-sm mt-1">
                {q.questions?.length || 0} question(s) • Passscore: {q.passScore}% • Max attempts: {q.maxAttempts ?? "∞"}
              </div>

              {owns && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuizClick(q.id);
                  }}
                  className="btn btn-submit mt-3"
                >
                  🎯 Commencer
                </button>
              )}

              {!owns && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyCourse();
                  }}
                  className="btn btn-primary mt-3"
                >
                  🛒 Acheter pour déverrouiller
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}