import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { apiUrl } from "../config";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return false;
    }

    if (cleanName.length < 2) {
      setError("Name must contain at least 2 characters.");
      return false;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Please enter a password.");
      return false;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must contain 8+ characters, uppercase, lowercase, number and special character."
      );
      return false;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Registration failed. Please try again."
        );
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setPassword("");
      setConfirmPassword("");

      setSuccess("Account created successfully! Redirecting...");

      window.setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Cannot connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      handleRegister();
    }
  };

  const eyeIcon = (visible: boolean) =>
    visible ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8a16.7 16.7 0 0 1-3.1 4.7" />
        <path d="M6.6 6.6C4.8 7.8 3.5 9.8 2 12c1.5 4 5 8 10 8 1.6 0 3-.4 4.2-1" />
      </svg>
    ) : (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <div className="auth-decoration auth-decoration-three" />

      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />

      <div className="auth-dot-grid auth-dot-grid-one" />
      <div className="auth-dot-grid auth-dot-grid-two" />

      <div className="auth-spark auth-spark-one">✦</div>
      <div className="auth-spark auth-spark-two">✦</div>

      <div className="auth-layout">
        {/* LEFT SIDE */}
        <section className="auth-intro">
          <div className="auth-logo">
            <div className="auth-logo-mark">✦</div>

            <div className="auth-logo-text">
              <div className="auth-logo-name">
                Career<span>Lane</span>
              </div>

              <div className="auth-logo-caption">
                AI CAREER INTELLIGENCE
              </div>
            </div>
          </div>

          <div className="auth-intro-content">
            <span className="auth-eyebrow">
              START YOUR CAREER JOURNEY
            </span>

            <h1>
              Build your
              <br />
              <span>career</span>
              <br />
              with clarity.
            </h1>

            <p className="auth-intro-description">
              Create your CareerLane account and get personalized
              resume insights, ATS analysis, skill-gap guidance and
              career recommendations.
            </p>

            <div className="auth-gold-line" />

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>

                <div>
                  <strong>AI Resume Analysis</strong>
                  <small>Understand your resume better</small>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>

                <div>
                  <strong>ATS Compatibility</strong>
                  <small>Improve your resume visibility</small>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">✓</div>

                <div>
                  <strong>Personalized Career Guidance</strong>
                  <small>Get a roadmap for your goals</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REGISTER CARD */}
        <section className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-badge">
              ✦&nbsp; CREATE ACCOUNT
            </div>

            <h2>Create Your Account</h2>

            <p className="auth-card-subtitle">
              Join CareerLane and start building your career with
              intelligent guidance.
            </p>

            <div className="auth-form">
              {/* NAME */}
              <div className="form-group">
                <label htmlFor="register-name">
                  Full Name
                </label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="register-email">
                  Email Address
                </label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="password-wrapper">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {eyeIcon(showPassword)}
                  </button>
                </div>

                <small className="password-hint">
                  Use 8+ characters with uppercase, lowercase,
                  number and special character.
                </small>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label htmlFor="register-confirm-password">
                  Confirm Password
                </label>

                <div className="password-wrapper">
                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {eyeIcon(showConfirmPassword)}
                  </button>
                </div>
              </div>

              {/* ERROR / SUCCESS */}
              {error && (
                <p className="auth-error">
                  {error}
                </p>
              )}

              {success && (
                <p className="auth-success">
                  {success}
                </p>
              )}

              {/* REGISTER BUTTON */}
              <button
                className="auth-btn"
                type="button"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="auth-btn-arrow">
                      →
                    </span>
                  </>
                )}
              </button>

              {/* LOGIN */}
              <p className="auth-switch">
                Already have an account?{" "}
                <Link to="/login">
                  Login here
                </Link>
              </p>

              {/* SECURITY */}
              <div className="auth-security">
                <span>◇</span>

                <small>
                  Your information is securely processed and
                  protected.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RegisterPage;