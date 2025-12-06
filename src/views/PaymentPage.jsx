import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import CourseController from "../controllers/CourseController";
import PurchaseController from "../controllers/PurchaseController";
import PaymentController from "../controllers/PaymentController";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const courseCtrl = new CourseController();
  const purchaseCtrl = new PurchaseController();
  const paymentCtrl = new PaymentController();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [owns, setOwns] = useState(false);

  const courseId = searchParams.get("courseId");

  useEffect(() => {
    const loadCourse = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      if (!courseId) {
        setError("ID du cours manquant");
        setLoading(false);
        return;
      }

      try {
        const courseData = await courseCtrl.getCourse(courseId);
        if (!courseData) {
          setError("Cours introuvable");
          setLoading(false);
          return;
        }
        setCourse(courseData);

        const hasAccess = await purchaseCtrl.userOwnsCourse(user.uid, courseId);
        setOwns(hasAccess);

        if (hasAccess) {
          setTimeout(() => navigate(`/lesson/${courseId}`), 2000);
        }
      } catch (err) {
        console.error("Error loading course:", err);
        setError("Erreur lors du chargement du cours");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [user, courseId]);

  const handleConfirmPayment = async () => {
    if (!user || !course) return;

    setProcessing(true);
    setError("");

    try {
      // Créer le paiement via backend
      const paymentRes = await paymentCtrl.startPayment(course.price, course.id, user.uid);

      if (paymentRes.status === "pending" && paymentRes.paymentUrl) {
        // Stocker temporairement les infos de paiement
        sessionStorage.setItem(
          "pendingPayment",
          JSON.stringify({
            token: paymentRes.token,
            courseId: course.id,
            userId: user.uid,
          })
        );

        // Redirection vers Paymee avec return_url vers ton callback
        const returnUrl = `${window.location.origin}/payment-callback`;
        window.location.href = `${paymentRes.paymentUrl}&return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        setError("Erreur lors de la création du paiement");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Erreur: " + err.message);
      setProcessing(false);
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

  if (error && !course) {
    return (
      <div className="page-container">
        <div className="admin-lesson-wrapper">
          <div className="alert alert-error">❌ {error}</div>
          <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (owns) {
    return (
      <div className="page-container">
        <div className="admin-lesson-wrapper">
          <div className="alert alert-success">✅ Vous possédez déjà ce cours !</div>
          <p className="text-center mt-4">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-back">
            ← Retour
          </button>
          <h1 className="page-title">Confirmer le paiement</h1>
        </div>

        {course && (
          <div className="payment-summary-card">
            <div className="payment-header">
              <h2 className="text-2xl font-bold mb-2">Récapitulatif</h2>
              <div className="divider"></div>
            </div>

            <div className="payment-details">
              <div className="payment-row">
                <span className="label">Cours :</span>
                <span className="value font-semibold">{course.title}</span>
              </div>
              <div className="payment-row">
                <span className="label">Description :</span>
                <span className="value text-gray-600">{course.description}</span>
              </div>
              <div className="divider my-4"></div>
              <div className="payment-row text-lg">
                <span className="label font-bold">Montant total :</span>
                <span className="value font-bold text-2xl text-blue-600">{course.price} TND</span>
              </div>
            </div>

            {error && <div className="alert alert-error mt-4">❌ {error}</div>}

            <div className="payment-actions mt-6">
              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="btn btn-primary btn-lg w-full"
              >
                {processing ? (
                  <>
                    <div className="spinner-small inline-block mr-2"></div>
                    Redirection vers Paymee...
                  </>
                ) : (
                  <>💳 Procéder au paiement</>
                )}
              </button>

              <button
                onClick={() => navigate(-1)}
                disabled={processing}
                className="btn btn-secondary w-full mt-3"
              >
                Annuler
              </button>
            </div>

            <div className="payment-info mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                🔒 <strong>Paiement sécurisé</strong> par Paymee
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Vous serez redirigé vers la plateforme de paiement sécurisée Paymee
                pour finaliser votre achat.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .payment-summary-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .divider { height: 1px; background: #e5e7eb; margin: 1rem 0; }
        .payment-row { display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; gap: 1rem; }
        .payment-row .label { color: #6b7280; font-size: 0.95rem; min-width: 120px; }
        .payment-row .value { text-align: right; flex: 1; }
        .spinner-small { width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
