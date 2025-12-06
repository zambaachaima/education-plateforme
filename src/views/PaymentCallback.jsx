import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentController from "../controllers/PaymentController";

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const paymentCtrl = new PaymentController();

  useEffect(() => {
    const processPayment = async () => {
      const pendingPayment = JSON.parse(sessionStorage.getItem("pendingPayment"));
      if (!pendingPayment) {
        setError("Aucun paiement en attente");
        setLoading(false);
        return;
      }

      try {
        const { token, courseId, userId } = pendingPayment;
        const res = await paymentCtrl.verifyPayment(token);

        if (res.success && res.status === "paid") {
          // Paiement validé → supprimer session
          sessionStorage.removeItem("pendingPayment");
          // Rediriger vers le cours
          navigate(`/lesson/${courseId}`);
        } else {
          setError("Paiement en attente ou échoué");
        }
      } catch (err) {
        setError("Erreur lors de la vérification du paiement");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [navigate]);

  return (
    <div className="page-container">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Vérification du paiement...</p>
        </div>
      ) : (
        error && <div className="alert alert-error">{error}</div>
      )}
    </div>
  );
}
