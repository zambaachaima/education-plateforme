import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Récupérer les données du paiement
    const pendingPaymentStr = sessionStorage.getItem("pendingPayment");
    
    if (!pendingPaymentStr) {
      navigate("/main");
      return;
    }

    const pendingPayment = JSON.parse(pendingPaymentStr);
    const { paymentUrl, token } = pendingPayment;

    // Ouvrir Paymee dans un nouvel onglet
    const paymeeWindow = window.open(paymentUrl, "_blank");

    // Démarrer le compte à rebours
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Après 5 secondes, rediriger vers la vérification
          navigate(`/payment-callback?payment_token=${token}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Vérifier si la fenêtre Paymee se ferme
    const checkWindowClosed = setInterval(() => {
      if (paymeeWindow && paymeeWindow.closed) {
        clearInterval(checkWindowClosed);
        clearInterval(interval);
        navigate(`/payment-callback?payment_token=${token}`);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(checkWindowClosed);
    };
  }, [navigate]);

  return (
    <div className="gateway-container">
      <div className="gateway-card">
        <div className="paymee-logo">
          <svg width="120" height="40" viewBox="0 0 120 40">
            <rect width="120" height="40" rx="8" fill="#4F46E5"/>
            <text x="60" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
              Paymee
            </text>
          </svg>
        </div>

        <h2>Redirection vers Paymee</h2>
        <p>Une nouvelle fenêtre s'est ouverte pour effectuer le paiement.</p>

        <div className="instructions">
          <div className="instruction-item">
            <span className="step-number">1</span>
            <span>Complétez votre paiement dans la fenêtre Paymee</span>
          </div>
          <div className="instruction-item">
            <span className="step-number">2</span>
            <span>Fermez la fenêtre après le paiement</span>
          </div>
          <div className="instruction-item">
            <span className="step-number">3</span>
            <span>Vous serez automatiquement redirigé</span>
          </div>
        </div>

        <div className="countdown-section">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-text">
            Redirection automatique dans {countdown} seconde{countdown !== 1 ? 's' : ''}
          </p>
        </div>

        <button 
          onClick={() => navigate("/payment-callback?payment_token=" + JSON.parse(sessionStorage.getItem("pendingPayment")).token)}
          className="btn-verify"
        >
          Vérifier le paiement maintenant
        </button>
      </div>

      <style jsx>{`
        .gateway-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .gateway-card {
          background: white;
          border-radius: 16px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .paymee-logo {
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }

        h2 {
          font-size: 1.75rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        p {
          color: #6b7280;
          margin-bottom: 2rem;
          font-size: 1.05rem;
        }

        .instructions {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .instruction-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .instruction-item:last-child {
          margin-bottom: 0;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #4F46E5;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .countdown-section {
          margin: 2rem 0;
        }

        .countdown-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .countdown-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
        }

        .countdown-text {
          color: #6b7280;
          font-size: 0.95rem;
          margin: 0;
        }

        .btn-verify {
          width: 100%;
          padding: 1rem;
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-verify:hover {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }
      `}</style>
    </div>
  );
}