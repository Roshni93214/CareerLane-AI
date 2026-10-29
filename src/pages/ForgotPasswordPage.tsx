import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
import { apiUrl } from "../config";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        apiUrl("/api/auth/forgot-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Unable to process your request. Please try again."
        );
        return;
      }

      setSuccess(
        data.message ||
          "Password reset link has been sent to your email. Please check your inbox and spam folder."
      );
    } catch (error) {
      console.error("Forgot password error:", error);

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
      handleSubmit();
    }
  };

  return (
    <main className="auth-simple-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <div className="auth-decoration auth-decoration-three" />

      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />

      <div className="auth-dot-grid auth-dot-grid-one" />
      <div className="auth-dot-grid auth-dot-grid-two" />

      <div className="auth-spark auth-spark-one">✦</div>
      <div className="auth-spark auth-spark-two">✦</div>

      <div className="auth-simple-shell">
        {/* BRAND */}
        <Link to="/login" className="auth-simple-brand">
          <div className="auth-simple-brand-mark">
            ✦
          </div>

          <div>
            <div className="auth-simple-brand-name">
              Career<span>Lane</span>
            </div>

            <div className="auth-logo-caption">
              AI CAREER INTELLIGENCE
            </div>
          </div>
        </Link>

        {/* CARD */}
        <section className="auth-simple-card">
          <div className="auth-header">
            <div className="auth-badge">
              ✦&nbsp; ACCOUNT RECOVERY
            </div>

            <h1>Forgot Password?</h1>

            <p>
              Enter your registered email address and we'll help
              you reset your CareerLane password.
            </p>
          </div>

          <div className="auth-form">
            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="forgot-email">
                Email Address
              </label>

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* ERROR */}
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="button"
              className="auth-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <span className="auth-btn-arrow">
                    →
                  </span>
                </>
              )}
            </button>

            {/* BACK TO LOGIN */}
            <p className="auth-switch">
              Remember your password?{" "}
              <Link to="/login">
                Back to Login
              </Link>
            </p>

            {/* SECURITY */}
            <div className="auth-security">
              <span>◇</span>

              <small>
                Your account information is handled securely.
              </small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;