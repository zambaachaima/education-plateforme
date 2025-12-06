// src/models/Payment.js
export default class Payment {
  constructor({
    id = null,
    userId,
    courseId,
    amount,
    transactionId = null,
    status = "pending", // "pending" | "success" | "failed"
    createdAt = new Date(),
  }) {
    this.id = id;
    this.userId = userId;
    this.courseId = courseId;
    this.amount = amount;
    this.transactionId = transactionId;
    this.status = status;
    this.createdAt = createdAt;
  }
}
