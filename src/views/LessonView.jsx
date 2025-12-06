// src/views/LessonView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import LessonController from "../controllers/LessonController";
import PurchaseController from "../controllers/PurchaseController";

export default function LessonView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const controller = new LessonController(courseId);
  const purchaseCtrl = new PurchaseController();

  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState("");
  const [owns, setOwns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) {
        navigate("/");
        return;
      }
      const hasAccess = await purchaseCtrl.userOwnsCourse(user.uid, courseId);
      setOwns(hasAccess);
      setLoading(false);
    };
    checkOwnership();
  }, [user, courseId]);

  useEffect(() => {
    const unsubscribe = controller.listenLessons((allLessons) => {
      // Show preview lessons or all if user owns course
      const visibleLessons = allLessons.filter((l) => owns || l.preview);
      setLessons(visibleLessons);
    });
    return () => unsubscribe();
  }, [courseId, owns]);

  // ✅ CORRECTION: Rediriger vers la page de paiement au lieu d'appeler l'API
  const handleBuyCourse = () => {
    if (!user) {
      alert("Veuillez vous connecter");
      navigate("/");
      return;
    }
    
    // Rediriger vers la page de paiement avec le courseId
    navigate(`/payment?courseId=${courseId}`);
  };

  const handleLessonClick = (lesson) => {
    if (lesson.preview || owns) {
      setSelectedLesson(lesson);
    } else {
      if (confirm("Ce contenu nécessite l'achat du cours. Voulez-vous procéder au paiement ?")) {
        handleBuyCourse();
      }
    }
  };

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-back">
            ← Retour
          </button>
          <h1 className="page-title">Leçons du cours</h1>
        </div>

        {!owns && (
          <div className="alert alert-warning mb-4">
            ⚠️ Vous n'avez pas accès à ce cours. Seules les leçons en aperçu sont disponibles.
            <button onClick={handleBuyCourse} className="btn btn-primary ml-4">
              🛒 Acheter ce cours
            </button>
          </div>
        )}

        <p className="course-info">
          {lessons.length} leçon{lessons.length > 1 ? "s" : ""} disponible{lessons.length > 1 ? "s" : ""}
        </p>

        <input
          type="text"
          placeholder="Rechercher une leçon..."
          className="input-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredLessons.length === 0 ? (
          <p className="text-gray-600 mt-4">Aucune leçon disponible pour ce cours.</p>
        ) : (
          <div className="lessons-grid mt-4">
            {filteredLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`lesson-card ${!lesson.preview && !owns ? 'lesson-locked' : ''}`}
                onClick={() => handleLessonClick(lesson)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex justify-between items-start">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  {!lesson.preview && !owns && (
                    <span className="badge badge-locked">🔒</span>
                  )}
                  {lesson.preview && (
                    <span className="badge badge-preview">👁️ Aperçu</span>
                  )}
                </div>
                <p className="lesson-type">Type : {lesson.type}</p>
                
                {(lesson.preview || owns) && (
                  <div className="lesson-file mt-3">
                    {lesson.fileUrl && lesson.type === "video" && (
                      <video src={lesson.fileUrl} controls className="video-preview" />
                    )}
                    {lesson.fileUrl && lesson.type === "doc" && (
                      <a href={lesson.fileUrl} target="_blank" rel="noreferrer" className="file-link">
                        📄 {lesson.fileName}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal for selected lesson */}
        {selectedLesson && (
          <div className="modal-overlay" onClick={() => setSelectedLesson(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="modal-title">{selectedLesson.title}</h2>
                <button onClick={() => setSelectedLesson(null)} className="btn btn-close">
                  ✕
                </button>
              </div>
              
              {selectedLesson.type === "video" && selectedLesson.fileUrl && (
                <video src={selectedLesson.fileUrl} controls className="w-full" autoPlay />
              )}
              
              {selectedLesson.type === "doc" && selectedLesson.fileUrl && (
                <iframe 
                  src={selectedLesson.fileUrl} 
                  className="w-full h-96"
                  title={selectedLesson.title}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}