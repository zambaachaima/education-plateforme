import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthForm from "./views/AuthForm";
import MainPage from "./views/MainPage";
import UserView from "./views/UserView";

import CourseView from "./views/CourseView";
import AdminCourseView from "./views/AdminCourseView";

import LessonView from "./views/LessonView";
import AdminLessonView from "./views/AdminLessonView";

import QuizListView from "./views/QuizListView";
import QuizView from "./views/QuizView";
import AdminQuizView from "./views/AdminQuizView";
import QuizHistoryView from "./views/QuizHistoryView";

import PaymentPage from "./views/PaymentPage";
import PaymentCallback from "./views/PaymentCallback";
import PaymentCancelled from "./views/PaymentCancelled";

import ProtectedRoute from "./components/ProtectedRoute";

import { doc, getDoc } from "firebase/firestore";
import { db } from "./services/firebaseService";


function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner-large"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Authentication */}
        <Route
          path="/"
          element={!user ? <AuthForm /> : <Navigate to="/main" />}
        />

        {/* Main dashboard */}
        <Route
          path="/main"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <MainPage user={user} userData={userData} />
            </ProtectedRoute>
          }
        />

        {/* Admin: User management */}
        <Route
          path="/users"
          element={
            <ProtectedRoute user={user} userData={userData} adminOnly>
              <UserView user={user} />
            </ProtectedRoute>
          }
        />

        {/* Courses */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <CourseView user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute user={user} userData={userData} adminOnly>
              <AdminCourseView />
            </ProtectedRoute>
          }
        />

        {/* Lessons */}
        <Route
          path="/lesson/:courseId"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <LessonView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/lessons/:courseId"
          element={
            <ProtectedRoute user={user} userData={userData} adminOnly>
              <AdminLessonView />
            </ProtectedRoute>
          }
        />

        {/* Quizzes */}
        <Route
          path="/quizzes/:courseId"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <QuizListView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <QuizView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/quizzes/:courseId"
          element={
            <ProtectedRoute user={user} userData={userData} adminOnly>
              <AdminQuizView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz-history"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <QuizHistoryView />
            </ProtectedRoute>
          }
        />

        {/* Payment Routes */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-callback"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <PaymentCallback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-cancelled"
          element={
            <ProtectedRoute user={user} userData={userData}>
              <PaymentCancelled />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;