import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QuizController from "../controllers/QuizController";
import QuestionEditor from "../components/QuestionEditor";
import { v4 as uuidv4 } from "uuid";

const quizCtrl = new QuizController();

export default function AdminQuizView() {
  const { courseId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!courseId) return;
    const unsub = quizCtrl.listenQuizzesForCourse(courseId, setQuizzes);
    return () => unsub && unsub();
  }, [courseId]);

  const resetForm = () => {
    setEditingQuiz(null);
    setShowForm(false);
  };

  const createEmptyQuizPayload = () => ({
    courseId,
    title: "",
    description: "",
    questions: [
      { id: uuidv4(), text: "", choices: ["", "", ""], correctAnswerIndex: 0, explanation: "" }
    ],
    passScore: 70,
    maxAttempts: 3
  });

  const startNew = () => {
    setEditingQuiz(createEmptyQuizPayload());
    setShowForm(true);
  };

  const onQuestionChange = (idx, q) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((qq, i) => (i === idx ? q : qq))
    }));
  };

  const addQuestion = () => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: uuidv4(), text: "", choices: ["", "", ""], correctAnswerIndex: 0, explanation: "" }
      ]
    }));
  };

  const removeQuestion = idx => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingQuiz.id) {
        await quizCtrl.updateQuiz(editingQuiz.id, editingQuiz);
        alert("Quiz mis à jour !");
      } else {
        await quizCtrl.addQuiz(editingQuiz);
        alert("Quiz ajouté !");
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = q => {
    setEditingQuiz({ ...q });
    setShowForm(true);
  };

  const handleDelete = async q => {
    if (!confirm("Supprimer ce quiz ?")) return;
    setLoading(true);
    try {
      await quizCtrl.deleteQuiz(q.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <h1 className="page-title">Gestion des quizzes</h1>
        <p className="course-info">
          Ce cours contient {quizzes.length} quiz{quizzes.length > 1 ? "s" : ""}
        </p>

        <div className="lesson-controls">
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            className="input-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <button className="btn btn-add" onClick={startNew}>
            {showForm ? "Annuler" : editingQuiz ? "Modifier le quiz" : "Ajouter un quiz"}
          </button>
        </div>

        {/* QUIZ FORM */}
        {showForm && editingQuiz && (
          <form className="form-lesson" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Titre du quiz"
              className="form-input"
              required
              value={editingQuiz.title}
              onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
            />

            <input
              type="text"
              placeholder="Description"
              className="form-input"
              value={editingQuiz.description}
              onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
            />

            <input
              type="number"
              min="0"
              max="100"
              placeholder="Pass Score (%)"
              className="form-input"
              value={editingQuiz.passScore}
              onChange={e => setEditingQuiz({ ...editingQuiz, passScore: Number(e.target.value) })}
            />

            <input
              type="number"
              min="0"
              placeholder="Max Attempts"
              className="form-input"
              value={editingQuiz.maxAttempts}
              onChange={e => setEditingQuiz({ ...editingQuiz, maxAttempts: Number(e.target.value) })}
            />

            <h3 className="form-section-title">Questions du quiz</h3>

            {editingQuiz.questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                question={q}
                onChange={updated => onQuestionChange(idx, updated)}
                onRemove={() => removeQuestion(idx)}
              />
            ))}

            <button type="button" className="btn btn-add" onClick={addQuestion}>
              ➕ Ajouter une question
            </button>

            <div className="lesson-actions">
              <button type="submit" className="btn btn-submit" disabled={loading}>
                {editingQuiz.id ? "💾 Sauvegarder" : "➕ Créer"}
              </button>
              <button type="button" className="btn btn-delete" onClick={resetForm}>
                ❌ Annuler
              </button>
            </div>
          </form>
        )}

        {/* QUIZ LIST */}
        <div className="lessons-grid">
          {filteredQuizzes.map(q => (
            <div key={q.id} className="lesson-card">
              <h3 className="lesson-title">{q.title}</h3>
              <p className="lesson-type">{q.description}</p>
              <p className="lesson-status">
                {q.questions.length} questions • Passscore: {q.passScore}% • Max tentatives: {q.maxAttempts || "∞"}
              </p>

              <div className="lesson-actions">
                <button className="btn btn-edit" onClick={() => handleEdit(q)}>✏️</button>
                <button className="btn btn-delete" onClick={() => handleDelete(q)}>🗑️</button>
                <button className="btn btn-add" onClick={() => setPreviewQuiz(q)}>👁️ Aperçu</button>
              </div>
            </div>
          ))}
        </div>

        {/* PREVIEW MODAL */}
        {previewQuiz && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 className="modal-title">{previewQuiz.title} — Aperçu</h2>
              <p className="modal-description">{previewQuiz.description}</p>

              {previewQuiz.questions.map((q, i) => (
                <div key={q.id} className="modal-question">
                  <strong>Q{i + 1}. {q.text}</strong>
                  <ul>
                    {q.choices.map((c, ci) => (
                      <li key={ci} className={ci === q.correctAnswerIndex ? "correct" : ""}>
                        {c} {ci === q.correctAnswerIndex ? "✔️" : ""}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && <p className="modal-explanation">💡 {q.explanation}</p>}
                </div>
              ))}

              <button className="btn btn-delete" onClick={() => setPreviewQuiz(null)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
