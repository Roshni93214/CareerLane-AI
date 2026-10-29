import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResumeUpload.css";

import { apiUrl } from "../config";
function ResumeUploadPage() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =====================================================
  // FILE SELECTION
  // =====================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // ===================================================
    // ALLOWED FILE TYPES
    // ===================================================

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a PDF or Word document."
      );

      setSelectedFile(null);

      return;
    }


    // ===================================================
    // FILE SIZE
    // ===================================================

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must be less than 5 MB."
      );

      setSelectedFile(null);

      return;
    }


    // ===================================================
    // FILE ACCEPTED
    // ===================================================

    setSelectedFile(file);
  };


  // =====================================================
  // UPLOAD + ANALYZE RESUME
  // =====================================================

  const handleAnalyze = async () => {
    setError("");

    if (!selectedFile) {
      setError(
        "Please upload your resume first."
      );

      return;
    }


    // ===================================================
    // CHECK LOGIN
    // ===================================================

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Please login before uploading your resume."
      );

      navigate("/login");

      return;
    }


    try {
      setLoading(true);


      // =================================================
      // CREATE FORM DATA
      // =================================================

      const formData =
        new FormData();

      formData.append(
        "resume",
        selectedFile
      );


      // =================================================
      // UPLOAD RESUME
      // =================================================

      const response =
        await fetch(
          apiUrl("/api/resume/upload"),
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );


      const data =
        await response.json();


      // =================================================
      // UPLOAD ERROR
      // =================================================

      if (!response.ok) {
        setError(
          data.message ||
          "Resume upload failed."
        );

        return;
      }


      // =================================================
      // SUCCESS
      // =================================================

      console.log(
        "Resume analysis response:",
        data
      );


      // =================================================
      // MARK RESUME AS UPLOADED
      // =================================================

      localStorage.setItem("resumeUploaded", "true");
      sessionStorage.setItem("careerLaneResumeText", data.extractedText || "");
      sessionStorage.setItem("careerLaneResumeAnalysis", JSON.stringify(data.analysis || {}));

      if (data.file?.originalFileUrl) {
  sessionStorage.setItem(
    "careerLaneResumeFileUrl",
    data.file.originalFileUrl
  );
}

if (data.file?.mimetype) {
  sessionStorage.setItem(
    "careerLaneResumeFileType",
    data.file.mimetype
  );
}

if (data.file?.originalName) {
  sessionStorage.setItem(
    "careerLaneResumeFileName",
    data.file.originalName
  );
}
      // =================================================
      // GO TO ANALYSIS PAGE
      // =================================================

      navigate(
        "/resume-analysis",
        {
          state: {
            analysis:
              data.analysis,

            file:
              data.file,

            resumeText:
              data.extractedText,
          },
        }
      );

    } catch (error) {

      console.error(
        "Resume upload error:",
        error
      );

      setError(
        "Cannot connect to server. Please make sure the backend is running."
      );

    } finally {

      setLoading(false);
    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="resume-upload-section">

      <div className="resume-upload-container">


        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div className="resume-upload-intro">

          <span className="upload-badge">
            AI Resume Analyzer
          </span>


          <h1>
            Build Your Career
            <br />
            <span>With Confidence.</span>
          </h1>


          <p className="intro-description">
            Your resume is more than just a document.
            It's the first step toward finding the
            right opportunity.
          </p>


          {/* =================================================
              BENEFITS
          ================================================= */}

          <div className="resume-benefits">


            <div className="resume-benefit">

              <div className="benefit-icon">
                ✦
              </div>

              <div>
                <h3>
                  AI-Powered Analysis
                </h3>

                <p>
                  Understand your resume's strengths,
                  weaknesses and overall quality.
                </p>
              </div>

            </div>


            <div className="resume-benefit">

              <div className="benefit-icon">
                ✓
              </div>

              <div>
                <h3>
                  ATS Compatibility
                </h3>

                <p>
                  Check how effectively your resume
                  can perform with applicant tracking systems.
                </p>
              </div>

            </div>


            <div className="resume-benefit">

              <div className="benefit-icon">
                ◈
              </div>

              <div>
                <h3>
                  Personalized Guidance
                </h3>

                <p>
                  Get career recommendations based on
                  your skills and resume.
                </p>
              </div>

            </div>


            <div className="resume-benefit">

              <div className="benefit-icon">
                →
              </div>

              <div>
                <h3>
                  Actionable Improvements
                </h3>

                <p>
                  Discover practical improvements that
                  can make your resume stronger.
                </p>
              </div>

            </div>

          </div>


          {/* =================================================
              BOTTOM HIGHLIGHT
          ================================================= */}

          <div className="resume-upload-highlight">

            <span className="highlight-line"></span>

            <p>
              Your journey starts with one upload.
            </p>

          </div>

        </div>


        {/* =================================================
            RIGHT UPLOAD CARD
        ================================================= */}

        <div className="resume-upload-card">


          {/* =================================================
              CARD ICON
          ================================================= */}

          <div className="upload-icon">
            <span>📄</span>
          </div>


          <h2>
            Upload Your Resume
          </h2>


          <p className="upload-description">
            Upload your latest resume to get
            personalized AI-powered career guidance.
          </p>


          {/* =================================================
              FILE UPLOAD
          ================================================= */}

          <label className="upload-box">

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />


            <div className="upload-cloud-icon">
              ↑
            </div>


            <span className="upload-main-text">

              {selectedFile
                ? selectedFile.name
                : "Choose your resume"}

            </span>


            <small>
              Drag & drop or click to browse
            </small>


            <small className="upload-format">
              PDF, DOC or DOCX • Maximum 5 MB
            </small>

          </label>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <p className="upload-error">
              {error}
            </p>
          )}


          {/* =================================================
              SELECTED FILE
          ================================================= */}

          {selectedFile &&
            !error && (
              <div className="selected-file">

                <span className="file-check">
                  ✓
                </span>

                <span>
                  {selectedFile.name}
                </span>

              </div>
            )}


          {/* =================================================
              ANALYZE BUTTON
          ================================================= */}

          <button
            className="analyze-btn"
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="loading-spinner"></span>

                Analyzing Resume...
              </>
            ) : (
              "Analyze Resume →"
            )}

          </button>


          {/* =================================================
              NOTE
          ================================================= */}

          <p className="upload-note">
            Your resume will be securely analyzed
            to provide personalized career insights.
          </p>

        </div>

      </div>

    </section>
  );
}

export default ResumeUploadPage;
