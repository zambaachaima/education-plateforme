export default class Course {
  constructor(id, title, price = 0, description = "", isPublished = false) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
    this.isPublished = isPublished;
  }
}
