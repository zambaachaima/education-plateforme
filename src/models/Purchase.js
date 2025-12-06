// src/models/Purchase.js
export default class Purchase {
  constructor({
    id = null,
    userId,
    courseId,
    status = "pending",
    createdAt = new Date(),
  }) {
    this.id = id;
    this.userId = userId;
    this.courseId = courseId;
    this.status = status; // "pending" | "paid"
    this.createdAt = createdAt;
  }
}
