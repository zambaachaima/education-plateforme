// src/models/Quiz.js
export default class Quiz {
  constructor({
    id = null,
    courseId,
    title = "",
    description = "",
    questions = [],
    passScore = 70, // percent
    maxAttempts = 3, // 0 or null meaning unlimited
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.courseId = courseId;
    this.title = title;
    this.description = description;
    // questions: array of { id, text, choices: [str], correctAnswerIndex, explanation }
    this.questions = questions || [];
    this.passScore = passScore;
    this.maxAttempts = maxAttempts == null ? null : Number(maxAttempts);
    this.createdAt = createdAt
      ? typeof createdAt.toDate === "function"
        ? createdAt.toDate()
        : new Date(createdAt)
      : new Date();
    this.updatedAt = updatedAt
      ? typeof updatedAt.toDate === "function"
        ? updatedAt.toDate()
        : new Date(updatedAt)
      : null;
  }
}
