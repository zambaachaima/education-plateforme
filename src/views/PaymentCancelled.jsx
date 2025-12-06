import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear pending payment
    sessionStorage.removeItem('pendingPayment');
  }, []);

  return (
    <div className="page-container">
      <div className="payment-callback-container">
        <div className="payment-status error">
          <div className="error-icon">⚠️</div>
          
          <h1>Paiement annulé</h1>
          <p>Vous avez annulé le processus de paiement.</p>
          <p className="text-gray-600">Aucun montant n'a été débité de votre compte.</p>
          
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/main')} className="btn btn-primary">
              Retour au tableau de bord
            </button>
            <button onClick={() => navigate(-2)} className="btn btn-secondary">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}