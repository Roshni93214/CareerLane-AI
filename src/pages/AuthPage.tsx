import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/Auth.css";

import { apiUrl } from "../config";

function Auth() {

  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return window.localStorage.getItem("careerLaneRememberMe") === "true";
    } catch {
      return false;
    }
  });

  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem("careerLaneRememberMe") === "true"
        ? window.localStorage.getItem("careerLaneRememberedEmail") || ""
        : "";
    } catch {
      return "";
    }
  });

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  // =====================================================
// GOOGLE / FACEBOOK OAUTH CALLBACK HANDLER
// =====================================================

const oauthCallbackHandled = useRef(false);

useEffect(() => {
  const currentUrl = new URL(window.location.href);

  const oauthCode = currentUrl.searchParams.get("oauth_code");
  const oauthError = currentUrl.searchParams.get("oauth_error");

  // Normal login visit: no OAuth callback to process.
  if (!oauthCode && !oauthError) {
    return;
  }

  // Prevent duplicate processing.
  if (oauthCallbackHandled.current) {
    return;
  }

  oauthCallbackHandled.current = true;

  // Remove temporary OAuth parameters from the URL.
  currentUrl.searchParams.delete("oauth_code");
  currentUrl.searchParams.delete("oauth_error");

  window.history.replaceState(
    {},
    document.title,
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
  );

  // Handle errors returned by the backend.
  if (oauthError) {
    const messages: Record<string, string> = {
      invalid_state:
        "Google sign-in session could not be verified. Please try again.",

      provider_denied:
        "Google sign-in was cancelled or denied.",

      oauth_failed:
        "Google sign-in failed. Please try again.",

      google_not_configured:
        "Google OAuth is not configured correctly on the server.",

      facebook_not_configured:
        "Facebook OAuth is not configured correctly on the server.",
    };

    setError(
      messages[oauthError] ||
        "Social sign-in failed. Please try again."
    );

    return;
  }

  // Exchange the temporary OAuth ticket for a CareerLane JWT.
  const completeOAuthLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not complete Google sign-in. Please try again."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "The server did not return a valid login session."
        );
      }

      // Save the same session data used by normal login.
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setSuccess("Google login successful! Redirecting...");

      // Open the existing resume upload route.
      navigate("/resume-upload");
    } catch (oauthException) {
      console.error(
        "Google OAuth exchange failed:",
        oauthException
      );

      setError(
        oauthException instanceof Error
          ? oauthException.message
          : "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  void completeOAuthLogin();
}, [navigate]);

  const handleSocialLogin = (provider: "Facebook" | "Google" | "Apple" | "X") => {
    setError("");
    setSuccess("");

    // Set these Vite environment variables to backend OAuth-start URLs.
    const env = (import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }).env ?? {};
    // Use backend OAuth routes for Google and Facebook
      if (provider === "Google" || provider === "Facebook") {
        window.location.href = apiUrl(
          `/api/oauth/${provider.toLowerCase()}`
        );
        return;
      }
    const envKeyByProvider = {
      Facebook: "VITE_FACEBOOK_AUTH_URL",
      Google: "VITE_GOOGLE_AUTH_URL",
      Apple: "VITE_APPLE_AUTH_URL",
      X: "VITE_X_AUTH_URL",
    } as const;

    const envKey = envKeyByProvider[provider];
    const authUrl = env[envKey]?.trim();

    if (!authUrl) {
      setError(
        `${provider} login is not configured yet. Add ${envKey} to your frontend .env and configure the provider OAuth callback in your backend.`,
      );
      return;
    }

    try {
      const parsed = new URL(authUrl, window.location.origin);
      if (
        parsed.protocol !== "https:" &&
        parsed.hostname !== "localhost" &&
        parsed.hostname !== "127.0.0.1"
      ) {
        setError("The social login URL must use HTTPS.");
        return;
      }
      window.location.assign(parsed.href);
    } catch {
      setError(`${provider} login URL is invalid. Please check ${envKey}.`);
    }
  };

  const handleLogin = async () => {

    setError("");

    setSuccess("");

    const value = email.trim().toLowerCase();

    if (!value) {

      setError("Please enter your email.");

      return;

    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {

      setError("Please enter a valid email address.");

      return;

    }

    if (!password) {

      setError("Please enter your password.");

      return;

    }

    if (password.length < 8) {

      setError("Password must be at least 8 characters.");

      return;

    }

    try {

      setLoading(true);

      const response = await fetch(apiUrl("/api/auth/login"), {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          email: value,

          password,

        }),

      });

      const data = await response.json();

      if (!response.ok) {

        setError(data.message || "Invalid email or password.");

        return;

      }

      if (!data.token) {

        setError("Login failed. No authentication token received.");

        return;

      }

      localStorage.setItem("token", data.token);

      try {
        if (rememberMe) {
          localStorage.setItem("careerLaneRememberMe", "true");
          localStorage.setItem("careerLaneRememberedEmail", value);
        } else {
          localStorage.removeItem("careerLaneRememberMe");
          localStorage.removeItem("careerLaneRememberedEmail");
        }
      } catch {
        // Storage may be unavailable; the authenticated login can still continue.
      }

      if (data.user) {

        localStorage.setItem("user", JSON.stringify(data.user));

      }

      setSuccess("Login successful! Redirecting...");

      setPassword("");

      window.setTimeout(() => {

        navigate("/resume-upload");

      }, 700);

    } catch (error) {

      console.error("Login error:", error);

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

      handleLogin();

    }

  };

  const eyeIcon = showPassword ? (

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

              YOUR CAREER, INTELLIGENTLY GUIDED

            </span>

            <h1>

              Turn your

              <br />

              <span>potential</span>

              <br />

              into progress.

            </h1>

            <p className="auth-intro-description">

              Analyze your resume, discover your strengths, identify

              skill gaps and move confidently toward the career you

              want.

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

        {/* LOGIN CARD */}

        <section className="auth-card">

          <div className="auth-card-inner">

            <div className="auth-badge">

              ✦&nbsp; WELCOME BACK

            </div>

            <h2>Welcome Back</h2>

            <p className="auth-card-subtitle">

              Login to continue your career journey with CareerLane.

            </p>

              <div className="auth-form">
                <div className="auth-social-buttons" aria-label="Social login options">
                  {/*<button
                    type="button"
                    className="auth-social-btn auth-social-facebook"
                    onClick={() => handleSocialLogin("Facebook")}
                    disabled={loading}
                  >
                    <span className="auth-social-icon" aria-hidden="true">f</span>
                    <span>Log in with Facebook</span>
                  </button>*/}

                  <button
                    type="button"
                    className="auth-social-btn auth-social-google"
                    onClick={() => handleSocialLogin("Google")}
                    disabled={loading}
                  >
                    <span className="auth-social-icon auth-social-google-mark" aria-hidden="true">G</span>
                    <span>Log in with Google</span>
                  </button>

                  {/*<button
                    type="button"
                    className="auth-social-btn auth-social-apple"
                    onClick={() => handleSocialLogin("Apple")}
                    disabled={loading}
                  >
                    <span className="auth-social-icon auth-social-apple-mark" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.7 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.5 2-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.7.7 2.8.7c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-1.7-.7-1.7-3.4z" />
                        <path d="M14.5 5.9c.6-.7 1-1.7.9-2.6-.9 0-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.5.9.1 1.9-.4 2.5-1.2z" />
                      </svg>
                    </span>
                    <span>Log in with Apple</span>
                  </button>*/}

                  {/*<button
                    type="button"
                    className="auth-social-btn auth-social-x"
                    onClick={() => handleSocialLogin("X")}
                    disabled={loading}
                  >
                    <span className="auth-social-icon auth-social-x-mark" aria-hidden="true">𝕏</span>
                    <span>Log in with X</span>
                  </button>*/}
                </div>

                <div className="auth-divider auth-social-divider">
                  <span />
                  <b>OR</b>
                  <span />
                </div>

              {/* EMAIL */}

              <div className="form-group">

                <label htmlFor="login-email">

                  Email Address

                </label>

                <input

                  id="login-email"

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

                <div className="form-label-row">

                  <label htmlFor="login-password">

                    Password

                  </label>

                </div>

                <div className="password-wrapper">

                  <input

                    id="login-password"

                    type={showPassword ? "text" : "password"}

                    placeholder="Enter your password"

                    value={password}

                    onChange={(event) => {

                      setPassword(event.target.value);

                      setError("");

                    }}

                    onKeyDown={handleKeyDown}

                    disabled={loading}

                    autoComplete="current-password"

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

                    {eyeIcon}

                  </button>

                </div>

              </div>

                <div className="auth-remember-row">
                  <label className="auth-remember-label" htmlFor="remember-login">
                    <input
                      id="remember-login"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
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

              {/* LOGIN BUTTON */}

              <button

                className="auth-btn"

                type="button"

                onClick={handleLogin}

                disabled={loading}

              >

                {loading ? (

                  <>

                    <span className="loading-spinner" />

                    Logging in...

                  </>

                ) : (

                  <>

                    Login to CareerLane

                    <span className="auth-btn-arrow">

                      →

                    </span>

                  </>

                )}

              </button>

              {/* REGISTER */}

              <p className="auth-switch">

                Don't have an account?{" "}

                <Link to="/register">

                  Create an account

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

export default Auth;
