import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LessonController from "../controllers/LessonController";

export default function AdminLessonView() {
  const { courseId } = useParams();
  const controller = new LessonController(courseId);

  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "video",
    preview: false,
    file: null
  });
  const [editingLesson, setEditingLesson] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = controller.listenLessons(setLessons);
    return () => unsubscribe();
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingLesson) {
        await controller.updateLesson(
          editingLesson.id,
          { title: form.title, type: form.type, preview: form.preview },
          form.file
        );
        alert("Leçon mise à jour !");
      } else {
        await controller.addLesson(
          courseId,
          form.title,
          form.type,
          form.preview,
          form.file
        );
        alert("Leçon ajoutée !");
      }

      setForm({ title: "", type: "video", preview: false, file: null });
      setEditingLesson(null);
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  const startEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      type: lesson.type,
      preview: lesson.preview,
      file: null
    });
    setShowForm(true);
  };

  const handleDelete = async (lesson) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await controller.deleteLesson(lesson.id);
  };

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <h1 className="page-title">Gestion des leçons</h1>
        <p className="course-info">
          Ce cours contient {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
        </p>

        <div className="lesson-controls">
          <input
            type="text"
            placeholder="Rechercher une leçon..."
            className="input-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn btn-add"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Annuler" : editingLesson ? "Modifier la leçon" : "Ajouter une leçon"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-lesson">
            <input
              type="text"
              placeholder="Titre"
              value={form.title}
              required
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="video">Vidéo</option>
              <option value="doc">Document</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.preview}
                onChange={(e) => setForm({ ...form, preview: e.target.checked })}
              />
              Publié (aperçu)
            </label>

            <input
              type="file"
              accept={form.type === "video" ? "video/*" : ".pdf,.doc,.docx"}
              onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              required={!editingLesson}
            />

            <button className="btn btn-submit" disabled={loading}>
              {editingLesson ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        )}

        <div className="lessons-grid">
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <h3 className="lesson-title">{lesson.title}</h3>
              <p className="lesson-type">Type : {lesson.type}</p>
              <p className="lesson-status">{lesson.preview ? "✅ Publié" : "❌ Brouillon"}</p>
              <div className="lesson-file">
                {lesson.fileUrl ? (
                  lesson.type === "video" ? (
                    <video src={lesson.fileUrl} controls className="video-preview" />
                  ) : (
                    <a href={lesson.fileUrl} target="_blank" rel="noreferrer" className="file-link">
                      {lesson.fileName}
                    </a>
                  )
                ) : "-"}
              </div>
              <div className="lesson-actions">
                <button className="btn btn-edit" onClick={() => startEdit(lesson)}>✏️</button>
                <button className="btn btn-delete" onClick={() => handleDelete(lesson)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
