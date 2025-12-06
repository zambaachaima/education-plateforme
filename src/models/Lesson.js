export default class Lesson {
  constructor(data) {
    this.id = data.id;
    this.courseId = data.courseId;
    this.title = data.title;
    this.type = data.type;
    this.preview = data.preview;
    this.fileUrl = data.fileUrl || null;
    this.fileName = data.fileName || null;

    // Convert Firestore timestamp → JS Date
    this.createdAt =
      data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null;

    this.updatedAt =
      data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : null;
  }
}
