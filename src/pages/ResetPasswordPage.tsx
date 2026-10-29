import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Auth.css";
import { apiUrl } from "../config";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Invalid or missing password reset token. Please request a new reset link."
      );
      return;
    }

    if (!password) {
      setError("Please enter your new password.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must contain 8+ characters, uppercase, lowercase, number and special character."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        apiUrl("/api/auth/reset-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Unable to reset your password. The link may have expired."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");

      setSuccess(
        data.message ||
          "Password reset successfully. Redirecting to login..."
      );

      window.setTimeout(() => {
        navigate("/login");
      }, 1600);
    } catch (error) {
      console.error("Reset password error:", error);

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
              ✦&nbsp; SECURE ACCOUNT
            </div>

            <h1>Reset Password</h1>

            <p>
              Create a new secure password for your CareerLane
              account.
            </p>
          </div>

          <div className="auth-form">
            {/* NEW PASSWORD */}
            <div className="form-group">
              <label htmlFor="reset-password">
                New Password
              </label>

              <div className="password-wrapper">
                <input
                  id="reset-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    setSuccess("");
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
              <label htmlFor="reset-confirm-password">
                Confirm New Password
              </label>

              <div className="password-wrapper">
                <input
                  id="reset-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                    setSuccess("");
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

            {/* ERROR */}
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {success && (
              <p className="auth-success">
                {success}
              </p>
            )}

            {/* BUTTON */}
            <button
              type="button"
              className="auth-btn"
              onClick={handleSubmit}
              disabled={loading || !token}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <span className="auth-btn-arrow">
                    →
                  </span>
                </>
              )}
            </button>

            {/* LOGIN */}
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
                Choose a strong password to keep your account
                secure.
              </small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ResetPasswordPage;