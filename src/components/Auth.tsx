import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import "../styles/Auth.css";
import { apiUrl } from "../config";

function Auth() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prevent OAuth callback from being processed twice.
  const oauthCallbackHandled = useRef(false);

  // --------------------------------------------------
  // COMPLETE GOOGLE / FACEBOOK OAUTH CALLBACK
  // --------------------------------------------------

  useEffect(() => {
    const currentUrl = new URL(window.location.href);

    const oauthCode = currentUrl.searchParams.get("oauth_code");
    const oauthError = currentUrl.searchParams.get("oauth_error");

    // Nothing to process if the URL has no OAuth callback.
    if (!oauthCode && !oauthError) {
      return;
    }

    // Prevent the same callback from being processed twice.
    if (oauthCallbackHandled.current) {
      return;
    }

    oauthCallbackHandled.current = true;

    // Remove temporary OAuth parameters from the browser URL.
    currentUrl.searchParams.delete("oauth_code");
    currentUrl.searchParams.delete("oauth_error");

    window.history.replaceState(
      {},
      document.title,
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    );

    // Handle cancellation or provider errors.
    if (oauthError) {
      const oauthErrorMessages: Record<string, string> = {
        google_cancelled:
          "Google sign-in was cancelled. Please try again.",

        facebook_cancelled:
          "Facebook sign-in was cancelled. Please try again.",

        invalid_state:
          "Your sign-in session could not be verified. Please try again.",

        google_failed:
          "Google sign-in failed. Please try again.",

        facebook_failed:
          "Facebook sign-in failed. Please try again.",
      };

      setError(
        oauthErrorMessages[oauthError] ||
          "Social sign-in failed. Please try again."
      );

      return;
    }

    if (!oauthCode) {
      return;
    }

    // Exchange the one-time ticket for a normal CareerLane JWT.
    const completeOAuthLogin = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          apiUrl("/api/oauth/exchange"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: oauthCode,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not complete social sign-in. Please try again."
          );
        }

        if (!data.token || !data.user) {
          throw new Error(
            "The server did not return a valid login session."
          );
        }

        // Use the same storage keys as normal email/password login.
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        // Preserve the existing Auth.tsx login destination.
        navigate("/resume-upload", { replace: true });
      } catch (oauthException) {
        console.error(
          "OAuth login error:",
          oauthException
        );

        setError(
          oauthException instanceof Error
            ? oauthException.message
            : "Social sign-in failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    void completeOAuthLogin();
  }, [navigate]);

  // --------------------------------------------------
  // EXISTING EMAIL / PASSWORD LOGIN
  // --------------------------------------------------

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        apiUrl("/api/auth/login"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      navigate("/");
    } catch (loginException) {
      console.error("Login error:", loginException);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE / FACEBOOK LOGIN BUTTON HANDLER
  // --------------------------------------------------

  const handleSocialLogin = (
    provider: "Google" | "Facebook"
  ) => {
    setError("");

    // Start OAuth through the backend.
    window.location.href = apiUrl(
      `/api/oauth/${provider.toLowerCase()}`
    );
  };

  // --------------------------------------------------
  // AUTH PAGE
  // --------------------------------------------------

  return (
    <section className="auth-section">
      <div className="auth-shell">
        {/* BRAND PANEL */}

        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <div className="auth-logo-mark">CL</div>

              <div>
                <div className="auth-logo-name">
                  Career<span>Lane</span>
                </div>

                <div className="auth-logo-caption">
                  AI CAREER INTELLIGENCE
                </div>
              </div>
            </div>

            <div className="auth-brand-message">
              <span className="auth-eyebrow">
                YOUR CAREER. YOUR DIRECTION.
              </span>

              <h1>
                Turn your
                <br />
                <span>potential</span> into
                <br />
                progress.
              </h1>

              <p>
                Understand your resume, discover the right
                opportunities and build a clear path toward
                your career goals.
              </p>
            </div>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <div className="auth-benefit-mark">✓</div>

                <div>
                  <strong>Resume Intelligence</strong>
                  <span>
                    Understand what recruiters see.
                  </span>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-mark">✓</div>

                <div>
                  <strong>Career Guidance</strong>
                  <span>
                    Find a direction built around you.
                  </span>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-mark">✓</div>

                <div>
                  <strong>Interview Preparation</strong>
                  <span>
                    Practice with intelligent feedback.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>
              Intelligent guidance for your next step.
            </span>

            <span className="auth-footer-line"></span>
          </div>
        </div>

        {/* LOGIN PANEL */}

        <div className="auth-form-panel">
          <div className="auth-container">
            <div className="auth-header">
              <span className="auth-form-label">
                WELCOME BACK
              </span>

              <h2>Sign in to CareerLane</h2>

              <p>
                Continue your career journey with
                personalized AI guidance.
              </p>
            </div>

            <div className="auth-form">
              {/* EMAIL */}

              <div className="form-group">
                <label htmlFor="auth-email">
                  Email Address
                </label>

                <div className="input-with-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="M3 7l9 6 9-6" />
                  </svg>

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="form-group">
                <div className="password-label-row">
                  <label htmlFor="auth-password">
                    Password
                  </label>

                  <Link to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>

                <div className="password-wrapper">
                  <svg
                    className="password-input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>

                  <input
                    id="auth-password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.5 4 10 8a16.7 16.7 0 01-3.1 4.7" />
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
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR MESSAGE */}

              {error && (
                <p
                  className="auth-error"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              {/* EMAIL / PASSWORD LOGIN BUTTON */}

              <button
                className="auth-btn"
                type="button"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="auth-btn-arrow">
                      →
                    </span>
                  </>
                )}
              </button>

              {/* SOCIAL LOGIN OPTIONS */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "22px 0 16px",
                  color: "#7b8494",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#e1e5eb",
                  }}
                />

                OR CONTINUE WITH

                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#e1e5eb",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                {/* GOOGLE */}

                <button
                  type="button"
                  onClick={() =>
                    handleSocialLogin("Google")
                  }
                  disabled={loading}
                  aria-label="Continue with Google"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    minHeight: "46px",
                    padding: "10px 12px",
                    border: "1px solid #d9dee7",
                    borderRadius: "9px",
                    background: "#ffffff",
                    color: "#293246",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: "19px",
                      fontWeight: 700,
                      color: "#4285F4",
                    }}
                  >
                    G
                  </span>

                  Google
                </button>

                {/* FACEBOOK */}

                <button
                  type="button"
                  onClick={() =>
                    handleSocialLogin("Facebook")
                  }
                  disabled={loading}
                  aria-label="Continue with Facebook"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    minHeight: "46px",
                    padding: "10px 12px",
                    border: "1px solid #d9dee7",
                    borderRadius: "9px",
                    background: "#ffffff",
                    color: "#293246",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "19px",
                      height: "19px",
                      borderRadius: "50%",
                      background: "#1877F2",
                      color: "#ffffff",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    f
                  </span>

                  Facebook
                </button>
              </div>

              {/* REGISTER */}

              <p className="auth-switch">
                New to CareerLane?{" "}
                <Link to="/register">
                  Create an account
                </Link>
              </p>

              {/* SECURITY */}

              <div className="auth-security">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                  />

                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>

                <span>
                  Your information is protected.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Auth;