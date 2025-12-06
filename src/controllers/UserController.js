import User from "../models/User";
import {
  addUserToDB,
  getAllUsersFromDB,
  listenToUsers,
  deleteUserFromDB,
  updateUserInDB,
  getUserById,
} from "../services/firebaseService";

export default class UserController {
  async getAllUsers() {
    const usersRaw = await getAllUsersFromDB();
    return usersRaw.map(
      (u) =>
        new User(u.id, u.name, u.email, u.isAdmin, u.createdAt, u.updatedAt)
    );
  }

  async addUser(name, email, isAdmin = false) {
    const id = await addUserToDB({ name, email, isAdmin });
    return new User(id, name, email, isAdmin);
  }

  async deleteUser(id) {
    await deleteUserFromDB(id);
  }

  async updateUser(id, updatedData) {
    await updateUserInDB(id, updatedData);
  }

  async getUser(id) {
    const user = await getUserById(id);
    if (!user) return null;
    return new User(
      user.id,
      user.name,
      user.email,
      user.isAdmin,
      user.createdAt,
      user.updatedAt
    );
  }

  listenUsers(callback) {
    return listenToUsers(callback);
  }
}
