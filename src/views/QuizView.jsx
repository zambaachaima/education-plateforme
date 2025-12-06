// src/views/QuizView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import QuizController from "../controllers/QuizController";
import QuizAttemptController from "../controllers/QuizAttemptController";
import PurchaseController from "../controllers/PurchaseController";

const quizCtrl = new QuizController();
const attemptCtrl = new QuizAttemptController();
const purchaseCtrl = new PurchaseController();

export default function QuizView() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [quiz, setQuiz] = useState(null);
  const [owns, setOwns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attemptsCount, setAttemptsCount] = useState(0);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuiz = async () => {
      const q = await quizCtrl.getQuizById(quizId);
      setQuiz(q);
      
      if (q) {
        // Check if user owns the course
        const hasAccess = await purchaseCtrl.userOwnsCourse(user.uid, q.courseId);
        setOwns(hasAccess);
        
        const initial = {};
        (q?.questions || []).forEach((qq) => {
          initial[qq.id] = null;
        });
        setAnswers(initial);
      }
      
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, user]);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user || !quiz) return;

      const attempts = await attemptCtrl.fetchAttemptsForQuizByUser(quiz.id, user.uid);
      setAttemptsCount(attempts.length);
    };
    fetchAttempts();
  }, [user, quiz]);

  const handleBuyCourse = () => {
    if (!user || !quiz) return;
    
    // Rediriger vers la page de paiement
    navigate(`/payment?courseId=${quiz.courseId}`);
  };

  const handleSelect = (questionId, index) => {
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  };

  const evaluate = (quizDoc, answersMap) => {
    const questions = quizDoc.questions || [];
    let correct = 0;
    const perQuestion = questions.map((q) => {
      const selected = answersMap[q.id];
      const isCorrect = typeof selected === "number" && selected === q.correctAnswerIndex;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        selectedIndex: selected,
        correct: isCorrect,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || "",
      };
    });
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= (quizDoc.passScore || 70);
    return { score, passed, correctCount: correct, total: questions.length, perQuestion };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!user) return setError("Tu dois être connecté pour passer le quiz.");
    if (!owns) return setError("Vous devez acheter ce cours pour passer le quiz.");

    try {
      setLoading(true);
      const attempts = await attemptCtrl.fetchAttemptsForQuizByUser(quiz.id, user.uid);
      if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts) {
        setError(`Nombre maximal de tentatives atteint (${quiz.maxAttempts}).`);
        setLoading(false);
        return;
      }

      const res = evaluate(quiz, answers);
      await attemptCtrl.addAttempt({
        quizId: quiz.id,
        userId: user.uid,
        quizTitle: quiz.title,
        answers: Object.keys(answers).map((qid) => ({ questionId: qid, selectedIndex: answers[qid] })),
        score: res.score,
        passed: res.passed,
      });

      setAttemptsCount((prev) => prev + 1);
      setResult(res);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
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

  if (!quiz) return <div className="page-container"><p>Quiz introuvable.</p></div>;

  const remainingAttempts = quiz.maxAttempts
    ? Math.max(quiz.maxAttempts - attemptsCount, 0)
    : Infinity;

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-back">
            ← Retour
          </button>
          <h1 className="page-title">{quiz.title}</h1>
        </div>

        {!owns && (
          <div className="alert alert-error mb-4">
            🔒 Vous devez acheter ce cours pour accéder aux quizzes.
            <button onClick={handleBuyCourse} className="btn btn-primary ml-4">
              🛒 Acheter ce cours
            </button>
          </div>
        )}

        {owns && (
          <>
            <p className="course-info">{quiz.description}</p>
            <p className="text-gray-700 mb-4">
              Tentatives : {attemptsCount} / {quiz.maxAttempts || "∞"}{" "}
              {remainingAttempts !== Infinity && `(restantes : ${remainingAttempts})`}
            </p>

            {result ? (
              <div className="quiz-card">
                <h2 className="text-xl font-semibold mb-2">Résultats</h2>
                <p>Score : <strong className={result.passed ? 'text-green-600' : 'text-red-600'}>{result.score}%</strong> ({result.correctCount}/{result.total})</p>
                <p>{result.passed ? <span className="text-green-600">✅ Réussi</span> : <span className="text-red-600">❌ Échoué</span>}</p>

                <div className="mt-4">
                  {result.perQuestion.map((pq, i) => {
                    const q = quiz.questions.find((x) => x.id === pq.questionId);
                    return (
                      <div key={pq.questionId} className="p-3 border rounded mb-2 bg-gray-50">
                        <div className="font-medium">{i + 1}. {q.text}</div>
                        <div className="mt-1">
                          {q.choices.map((c, ci) => (
                            <div key={ci} className={`pl-3 ${ci === q.correctAnswerIndex ? "font-semibold text-green-700" : ""} ${ci === pq.selectedIndex && ci !== q.correctAnswerIndex ? "text-red-600" : ""}`}>
                              {ci === pq.selectedIndex ? "→ " : ""}{c} {ci === q.correctAnswerIndex && "✓"}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <div className="text-gray-600 mt-1 italic">💡 {q.explanation}</div>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate("/quiz-history")} className="btn btn-secondary">📊 Historique</button>
                  <button onClick={() => navigate(-1)} className="btn btn-primary">← Retour</button>
                </div>
              </div>
            ) : remainingAttempts === 0 ? (
              <div className="alert alert-error">
                ❌ Vous avez atteint le nombre maximum de tentatives pour ce quiz.
                <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">← Retour</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="quiz-card">
                    <div className="font-medium mb-2">{idx + 1}. {q.text}</div>
                    <div className="flex flex-col gap-2">
                      {q.choices.map((c, ci) => (
                        <label key={ci} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === ci} onChange={() => handleSelect(q.id, ci)} />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {error && <div className="alert alert-error">{error}</div>}

                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="btn btn-submit">
                    {loading ? "⏳ Traitement..." : "✅ Soumettre"}
                  </button>
                  <button type="button" onClick={() => navigate("/quiz-history")} className="btn btn-secondary">
                    📊 Historique
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}