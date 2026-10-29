import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { useEffect, useState } from "react";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import RegisterPage from "./pages/RegisterPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import ResumeAnalysisPage from "./pages/ResumeAnalysis";
import RoadmapPage from "./pages/RoadmapPage";
import EditResumePage from "./pages/EditResumePage";
import ResumeTemplatesPage from "./pages/ResumeTemplatesPage";
import JobPreparationPage from "./pages/JobPreparationPage";
import InterviewPreparationPage from "./pages/InterviewPreparationPage";
import CareerChatbot from "./components/CareerChatbot";
import ResumeTemplateEditorPage from "./pages/ResumeTemplateEditorPage";


function AppContent() {
  const location = useLocation();

  // =====================================================
  // CHATBOT VISIBILITY STATE
  // =====================================================

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [resumeUploaded, setResumeUploaded] =
    useState(false);


  // =====================================================
  // CHECK LOGIN + RESUME STATUS
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const uploaded =
      localStorage.getItem("resumeUploaded");

    setIsAuthenticated(
      Boolean(token)
    );

    setResumeUploaded(
      uploaded === "true"
    );
  }, [location.pathname]);


  // =====================================================
  // PAGES WHERE CHATBOT SHOULD NOT APPEAR
  // =====================================================

  const hideChatbot =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";


  // =====================================================
  // CHATBOT VISIBILITY
  // =====================================================

  const showChatbot =
    !hideChatbot &&
    isAuthenticated &&
    resumeUploaded;


  return (
    <>
      {/* =================================================
          APPLICATION ROUTES
      ================================================= */}

      <Routes>

        {/* ==========================
            HOME PAGE
        ========================== */}

        <Route
          path="/"
          element={<Home />}
        />
        <Route
  path="/resume-template-editor"
  element={<ResumeTemplateEditorPage />}
/>


        {/* ==========================
            AUTHENTICATION PAGES
        ========================== */}

        <Route
          path="/login"
          element={<AuthPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />


        {/* ==========================
            RESUME PAGES
        ========================== */}

        <Route
          path="/resume-upload"
          element={<ResumeUploadPage />}
        />

        <Route
          path="/resume-analysis"
          element={<ResumeAnalysisPage />}
        />
        <Route
  path="/job-preparation"
  element={<JobPreparationPage />}
/>
<Route
  path="/interview-preparation"
  element={<InterviewPreparationPage />}
/>


        {/* ==========================
            CAREER ROADMAP
        ========================== */}

        <Route
          path="/roadmap"
          element={<RoadmapPage />}
        />

        {/* ==========================
            RESUME BUILDER
        ========================== */}

        <Route
          path="/edit-resume"
          element={<EditResumePage />}
        />

        <Route
          path="/resume-templates"
          element={<ResumeTemplatesPage />}
        />

      </Routes>


      {/* =================================================
          GLOBAL CAREERLANE AI
      ================================================= */}

      {showChatbot && (
        <CareerChatbot />
      )}
    </>
  );
}


// =====================================================
// MAIN APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}


export default App;