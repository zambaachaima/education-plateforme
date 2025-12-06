import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { signUp, login, logout, resetPassword } from "../services/firebaseAuthService";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (form.password !== form.confirmPassword)
          return alert("Les mots de passe ne correspondent pas !");
        await signUp(form.email, form.password, form.name);
        alert("Compte créé ! Vérifie ton email.");
      }
      setForm({ email: "", password: "", confirmPassword: "", name: "" });
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    alert("Déconnecté !");
  };

  const handleForgotPassword = async () => {
    if (!form.email) return alert("Merci de saisir votre email !");
    await resetPassword(form.email);
  };

  return (
    <div className="page-container">
      <div className="admin-lesson-wrapper">
        <div className="lesson-card" style={{ maxWidth: "400px", margin: "2rem auto" }}>
          <h2 className="lesson-title text-center">{isLogin ? "Connexion" : "Inscription"}</h2>

          <form className="form-lesson" onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Nom"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="form-input"
            />

            {!isLogin && (
              <input
                type="password"
                placeholder="Confirmer mot de passe"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="form-input"
              />
            )}

            <div className="lesson-actions">
              <button type="submit" className="btn btn-submit">
                {isLogin ? "Se connecter" : "S’inscrire"}
              </button>
              {currentUser && (
                <button type="button" className="btn btn-delete" onClick={handleLogout}>
                  Déconnexion
                </button>
              )}
            </div>
          </form>

          <div className="lesson-actions" style={{ justifyContent: "center", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="btn btn-add" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Créer un compte" : "Déjà un compte ? Se connecter"}
            </button>

            {isLogin && (
              <button className="btn btn-edit" onClick={handleForgotPassword}>
                Mot de passe oublié ?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
