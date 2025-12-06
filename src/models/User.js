export default class User {
  constructor(
    id,
    name,
    email,
    isAdmin = false,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.isAdmin = isAdmin;
    this.createdAt = createdAt?.toDate
      ? createdAt.toDate()
      : createdAt
      ? new Date(createdAt)
      : new Date();
    this.updatedAt = updatedAt?.toDate
      ? updatedAt.toDate()
      : updatedAt
      ? new Date(updatedAt)
      : null;
  }
}
