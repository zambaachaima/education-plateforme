import { useState, useEffect } from "react";
import CourseController from "../controllers/CourseController";

export default function AdminCourseView() {
  const controller = new CourseController();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    id: null,
    title: "",
    price: "",
    description: "",
    isPublished: false,
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const unsub = controller.listenCourses
      ? controller.listenCourses(setCourses)
      : null;
    return () => unsub && unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await controller.updateCourse(editingCourse, form);
        alert("Cours mis à jour !");
      } else {
        await controller.addCourse(
          form.title,
          parseFloat(form.price),
          form.description,
          form.isPublished
        );
        alert("Cours ajouté !");
      }
      setForm({ id: null, title: "", price: "", description: "", isPublished: false });
      setEditingCourse(null);
      setShowForm(false);
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course.id);
    setForm(course);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingCourse(null);
    setForm({ id: null, title: "", price: "", description: "", isPublished: false });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Supprimer ce cours ?")) {
      try {
        await controller.deleteCourse(id);
        alert("Cours supprimé !");
      } catch (err) {
        alert("Erreur : " + err.message);
      }
    }
  };

  // Recherche + tri
  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    if (typeof fieldA === "string" && typeof fieldB === "string")
      return sortOrder === "asc"
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    if (typeof fieldA === "number" && typeof fieldB === "number")
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    return 0;
  });

  // Stats
  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount = courses.length - publishedCount;

  return (
    <div className="page-container">
      <div className="admin-course-wrapper">
        <h1 className="page-title">Gestion des cours</h1>

        {/* Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <strong>Statistiques :</strong>
            <p>Publié : {publishedCount}</p>
            <p>Brouillon : {draftCount}</p>
          </div>
        </div>

        {/* Actions + recherche + tri */}
        <div className="controls-container">
          <button className="btn btn-add" onClick={handleAddClick}>
            Ajouter un cours
          </button>

          <input
            type="text"
            placeholder="Rechercher..."
            className="input-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="sort-controls">
            <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
              <option value="title">Titre</option>
              <option value="price">Prix</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Ascendant</option>
              <option value="desc">Descendant</option>
            </select>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="form-course">
            <input
              name="title"
              placeholder="Titre"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              name="price"
              type="number"
              placeholder="Prix"
              value={form.price}
              onChange={handleChange}
              required
            />
            <input
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
            />
            <label>
              Publier :
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
              />
            </label>
            <div className="form-buttons">
              <button className="btn btn-submit">
                {editingCourse ? "Enregistrer" : "Ajouter"}
              </button>
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Courses Table */}
        <div className="courses-grid">
          {sortedCourses.map((c) => (
            <div key={c.id} className="course-card">
              <h3 className="course-title">{c.title}</h3>
              <p className="course-desc">{c.description}</p>
              <p className="course-price">{c.price} TND</p>
              <p className="course-status">{c.isPublished ? "✅ Publié" : "❌ Brouillon"}</p>
              <div className="course-actions">
                <button className="btn btn-edit" onClick={() => handleEdit(c)}>✏️</button>
                <button className="btn btn-delete" onClick={() => handleDelete(c.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
