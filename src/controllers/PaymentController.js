// src/controllers/PaymentController.js
export default class PaymentController {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  }

  /**
   * Créer un paiement via le backend
   * @param {number} amount - Montant en TND
   * @param {string} courseId - ID du cours
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - { status, token, paymentUrl }
   */
  async startPayment(amount, courseId, userId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          courseId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création du paiement");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ PaymentController startPayment error:", error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * @param {string} token - Token du paiement Paymee
   * @returns {Promise<Object>} - { status: "pending" | "paid", courseId? }
   */
  async checkPaymentStatus(token) {
    try {
      const response = await fetch(`${this.apiUrl}/api/payments/check/${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la vérification du paiement");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ PaymentController checkPaymentStatus error:", error);
      throw error;
    }
  }

  /**
   * Récupérer tous les paiements d'un utilisateur (optionnel)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des paiements
   */
  async getUserPayments(userId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/payments/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des paiements");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ PaymentController getUserPayments error:", error);
      throw error;
    }
  }
}