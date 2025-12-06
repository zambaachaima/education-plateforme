import { useState, useEffect } from "react";
import UserController from "../controllers/UserController";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function UserView() {
  const controller = new UserController();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", isAdmin: false });
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const unsubscribe = controller.listenUsers(setUsers);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return alert("Remplis tous les champs !");
    try {
      if (editingUser) {
        await controller.updateUser(editingUser, { ...form });
        alert("Utilisateur mis à jour !");
        setEditingUser(null);
      } else {
        await controller.addUser(form.name, form.email, form.isAdmin);
        alert("Utilisateur ajouté !");
      }
      setForm({ name: "", email: "", isAdmin: false });
      setShowForm(false);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setForm({ name: user.name, email: user.email, isAdmin: user.isAdmin });
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", isAdmin: false });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      try {
        await controller.deleteUser(id);
        alert("Utilisateur supprimé !");
      } catch (err) {
        alert("Erreur : " + err.message);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    if (fieldA instanceof Date && fieldB instanceof Date)
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    if (typeof fieldA === "string" && typeof fieldB === "string")
      return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
    return 0;
  });

  const adminCount = users.filter(u => u.isAdmin).length;
  const normalCount = users.filter(u => !u.isAdmin).length;
  const chartData = [
    { name: "Admin", value: adminCount },
    { name: "Normal", value: normalCount }
  ];
  const COLORS = ["#1e3a8a", "#10b981"];

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <p className="course-info">
          Total : {users.length} utilisateur{users.length > 1 ? "s" : ""}
        </p>

       {/* Controls */}
<div className="lesson-controls">
  <input
    type="text"
    placeholder="Rechercher..."
    className="input-search"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <div className="flex gap-2">
    <select
      value={sortField}
      onChange={(e) => setSortField(e.target.value)}
      className="input-search"
    >
      <option value="name">Nom</option>
      <option value="createdAt">Créé</option>
      <option value="updatedAt">Mis à jour</option>
    </select>

    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
      className="input-search"
    >
      <option value="asc">Ascendant</option>
      <option value="desc">Descendant</option>
    </select>
  </div>

  <button className="btn btn-add" onClick={handleAddClick}>
    {showForm ? "Annuler" : editingUser ? "Modifier utilisateur" : "Ajouter utilisateur"}
  </button>
</div>


        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="form-lesson">
            <input
              type="text"
              placeholder="Nom"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              />
              Admin
            </label>
            <button className="btn btn-submit">
              {editingUser ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        )}

        {/* Users Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Créé</th>
                <th>Mis à jour</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? "✅" : "❌"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDate(u.updatedAt)}</td>
                  <td className="flex gap-2">
                    <button className="btn btn-edit" onClick={() => handleEdit(u)}>✏️</button>
                    <button className="btn btn-delete" onClick={() => handleDelete(u.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie chart at bottom */}
        <div className="chart-container">
          <PieChart width={200} height={200}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
