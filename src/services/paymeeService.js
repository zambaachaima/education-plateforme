const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * Crée un paiement via le backend
 * @param {number} amount - Montant à payer
 * @param {string} courseId - ID du cours
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Données retournées par le backend
 */
export async function createPayment(amount, courseId, userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, courseId, userId }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Backend returned invalid JSON: ${text}`);
    }

    if (!response.ok) {
      throw new Error(`Backend error ${response.status}: ${data?.error || text}`);
    }

    console.log("💡 Backend payment response:", data);
    return data;
  } catch (err) {
    console.error("Paymee createPayment error:", err);
    throw err;
  }
}

/**
 * Vérifie le statut d’un paiement via le backend
 * @param {string} token - Token de la transaction Paymee
 * @returns {Promise<Object>} - Données retournées par le backend
 */
export async function checkPaymentStatus(token) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payments/${token}/check`);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Backend returned invalid JSON: ${text}`);
    }

    if (!response.ok) {
      throw new Error(`Backend error ${response.status}: ${data?.error || text}`);
    }

    console.log("💡 Backend checkStatus response:", data);
    return data;
  } catch (err) {
    console.error("Paymee checkPaymentStatus error:", err);
    throw err;
  }
}
