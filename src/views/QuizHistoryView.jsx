// src/views/QuizHistoryView.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QuizAttemptController from "../controllers/QuizAttemptController";
import { getAuth } from "firebase/auth";
import { format } from "date-fns"; // Assure-toi d'installer date-fns : npm install date-fns

const attemptCtrl = new QuizAttemptController();

export default function QuizHistoryView() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/"); // pas connecté

      setLoading(true);
      try {
        // 🔹 Récupérer toutes les tentatives de l'utilisateur
        const allAttempts = await attemptCtrl.fetchAllAttemptsForUser(user.uid);
        setAttempts(allAttempts);
      } catch (err) {
        console.error("Erreur lors de la récupération des tentatives :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [auth, navigate]);

  if (loading) return <div className="p-6 text-center">Chargement de l’historique...</div>;

  if (attempts.length === 0)
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-semibold mb-4">Historique des quizzes</h1>
        <p>Aucune tentative enregistrée pour le moment.</p>
        <button
          onClick={() => navigate("/main")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retour au tableau de bord
        </button>
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Historique des quizzes</h1>

      <table className="min-w-full border divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">Cours / Quiz</th>
            <th className="px-6 py-3 text-left">Score</th>
            <th className="px-6 py-3 text-left">Réussi</th>
            <th className="px-6 py-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attempts.map((a) => (
            <tr key={a.id}>
              <td className="px-6 py-4">
                {a.quizTitle || "Quiz"} {/* si tu stockes le titre du quiz */}
              </td>
              <td className="px-6 py-4">{a.score}%</td>
              <td className="px-6 py-4">
                {a.passed ? <span className="text-green-600">✅</span> : <span className="text-red-600">❌</span>}
              </td>
              <td className="px-6 py-4">{a.createdAt?.toDate ? format(a.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => navigate("/main")}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Retour au tableau de bord
      </button>
    </div>
  );
}
