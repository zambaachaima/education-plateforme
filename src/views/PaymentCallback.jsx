import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Vérification du paiement en cours...");
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      // Récupérer les infos du sessionStorage
      const pendingPaymentStr = sessionStorage.getItem("pendingPayment");
      
      if (!pendingPaymentStr) {
        setStatus("failed");
        setMessage("Aucun paiement en attente trouvé");
        return;
      }

      const pendingPayment = JSON.parse(pendingPaymentStr);
      const { token, courseId: cId } = pendingPayment;

      if (!token) {
        setStatus("failed");
        setMessage("Token de paiement manquant");
        return;
      }

      setCourseId(cId);

      // Vérifier le statut avec polling (max 30 secondes)
      let attempts = 0;
      const maxAttempts = 15;
      
      const checkInterval = setInterval(async () => {
        attempts++;

        try {
          console.log(`Vérification ${attempts}/${maxAttempts}...`);
          
          // Appel direct au backend
          const response = await fetch(`http://localhost:5000/api/payments/check/${token}`);
          const result = await response.json();

          if (result.status === "paid") {
            clearInterval(checkInterval);
            setStatus("success");
            setMessage("Paiement confirmé ! Redirection...");
            
            sessionStorage.removeItem("pendingPayment");
            
            setTimeout(() => {
              navigate(`/lesson/${cId}`);
            }, 2000);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setStatus("timeout");
            setMessage("La vérification prend plus de temps que prévu.");
            
            setTimeout(() => {
              navigate("/student/courses");
            }, 5000);
          }
        } catch (error) {
          console.error("Erreur vérification:", error);
          
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setStatus("timeout");
            setMessage("Impossible de vérifier le paiement.");
          }
        }
      }, 2000);

      // Cleanup
      return () => clearInterval(checkInterval);
    };

    verifyPayment();
  }, [user]);

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper max-w-2xl mx-auto">
        <div className="payment-status-card">
          
          {/* Checking */}
          {status === "checking" && (
            <div className="text-center">
              <div className="loading-spinner mb-4">
                <div className="spinner"></div>
              </div>
              <h2 className="text-2xl font-bold mb-2">⏳ Vérification en cours</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Merci de patienter, cela peut prendre quelques instants...
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="text-center">
              <div className="success-icon mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Paiement réussi !
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            </div>
          )}

          {/* Timeout */}
          {status === "timeout" && (
            <div className="text-center">
              <div className="warning-icon mb-4">⏱️</div>
              <h2 className="text-2xl font-bold text-orange-600 mb-2">
                Vérification en cours
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/student/courses")}
                  className="btn btn-primary"
                >
                  Voir mes cours
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {status === "failed" && (
            <div className="text-center">
              <div className="error-icon mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de paiement
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-secondary"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => navigate("/student/courses")}
                  className="btn btn-primary"
                >
                  Mes cours
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .payment-status-card {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .success-icon {
          font-size: 4rem;
          animation: scaleIn 0.5s ease-out;
        }

        .warning-icon {
          font-size: 4rem;
          animation: scaleIn 0.5s ease-out;
        }

        .error-icon {
          font-size: 4rem;
          animation: shake 0.5s ease-out;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}