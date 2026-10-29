const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");

const router = express.Router();

/*
 * Short-lived, one-time OAuth login tickets.
 * Suitable for the current single-server setup.
 * For a multi-instance production deployment, use Redis or a database.
 */
const oauthTickets = new Map();

const TICKET_TTL_MS = 2 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const GRAPH_VERSION =
  process.env.FACEBOOK_GRAPH_VERSION || "v26.0";

const COOKIE_PATH = "/api/oauth";

function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
}

function getCallbackUrl(provider) {
  const backendUrl = (
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 5000}`
  ).replace(/\/+$/, "");

  if (provider === "google") {
    return (
      process.env.GOOGLE_CALLBACK_URL ||
      `${backendUrl}/api/oauth/google/callback`
    );
  }

  return (
    process.env.FACEBOOK_CALLBACK_URL ||
    `${backendUrl}/api/oauth/facebook/callback`
  );
}

function getFrontendRedirect(params = {}) {
  const path =
    process.env.AUTH_FRONTEND_LOGIN_PATH || "/login";

  const url = new URL(path, `${getFrontendUrl()}/`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function redirectError(res, errorCode) {
  return res.redirect(
    302,
    getFrontendRedirect({ oauth_error: errorCode })
  );
}

function stateCookieName(provider) {
  return `careerLaneOAuthState_${provider}`;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: OAUTH_STATE_TTL_MS,
  };
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";

  for (const part of header.split(";")) {
    const item = part.trim();
    const separator = item.indexOf("=");

    if (separator === -1) continue;

    const key = item.slice(0, separator);
    const value = item.slice(separator + 1);

    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return "";
}

function clearStateCookie(res, provider) {
  res.clearCookie(stateCookieName(provider), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.error_description ||
      data.error?.message ||
      data.message ||
      `OAuth provider returned HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

function getProviderCredentials(provider) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: getCallbackUrl("google"),
    };
  }

  return {
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackUrl: getCallbackUrl("facebook"),
  };
}

/* =====================================================
   START GOOGLE / FACEBOOK LOGIN
===================================================== */

function startOAuth(provider) {
  return (req, res) => {
    try {
      const credentials = getProviderCredentials(provider);

      if (
        !credentials.clientId ||
        !credentials.clientSecret ||
        !credentials.callbackUrl
      ) {
        return redirectError(
          res,
          `${provider}_not_configured`
        );
      }

      const state = crypto
        .randomBytes(32)
        .toString("hex");

      res.cookie(
        stateCookieName(provider),
        state,
        cookieOptions()
      );

      let authorizationUrl;

      if (provider === "google") {
        authorizationUrl = new URL(
          "https://accounts.google.com/o/oauth2/v2/auth"
        );

        authorizationUrl.searchParams.set(
          "client_id",
          credentials.clientId
        );

        authorizationUrl.searchParams.set(
          "redirect_uri",
          credentials.callbackUrl
        );

        authorizationUrl.searchParams.set(
          "response_type",
          "code"
        );

        authorizationUrl.searchParams.set(
          "scope",
          "openid email profile"
        );

        authorizationUrl.searchParams.set(
          "state",
          state
        );

        authorizationUrl.searchParams.set(
          "prompt",
          "select_account"
        );
      } else {
        authorizationUrl = new URL(
          `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
        );

        authorizationUrl.searchParams.set(
          "client_id",
          credentials.clientId
        );

        authorizationUrl.searchParams.set(
          "redirect_uri",
          credentials.callbackUrl
        );

        authorizationUrl.searchParams.set(
          "response_type",
          "code"
        );

        authorizationUrl.searchParams.set(
          "scope",
          "email,public_profile"
        );

        authorizationUrl.searchParams.set(
          "state",
          state
        );
      }

      return res.redirect(302, authorizationUrl.toString());
    } catch (error) {
      console.error(
        `${provider} OAuth start error:`,
        error.message
      );

      return redirectError(res, "oauth_failed");
    }
  };
}

router.get("/google", startOAuth("google"));
router.get("/facebook", startOAuth("facebook"));

/* =====================================================
   OAUTH STATE VALIDATION
===================================================== */

function validateOAuthState(req, res, provider) {
  const queryState = String(req.query.state || "");
  const cookieName = stateCookieName(provider);
  const storedState = readCookie(req, cookieName);

  clearStateCookie(res, provider);

  if (
    !queryState ||
    !storedState ||
    queryState.length !== storedState.length ||
    !crypto.timingSafeEqual(
      Buffer.from(queryState),
      Buffer.from(storedState)
    )
  ) {
    return false;
  }

  return true;
}

/* =====================================================
   CREATE OR FIND CAREERLANE USER
===================================================== */

async function findOrCreateOAuthUser(identity) {
  const name = String(identity.name || "")
    .trim()
    .slice(0, 120);

  const email = String(identity.email || "")
    .trim()
    .toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailPattern.test(email)) {
    throw new Error(
      "The provider did not return a usable email address."
    );
  }

  let user = await User.findOne({ email });

  if (user) {
    // Use the existing CareerLane account for this email.
    return user;
  }

  /*
   * Existing User schema requires a password.
   * Give social-only users a random, hashed password that
   * they do not know. They can use password reset later.
   */
  const randomPassword = crypto
    .randomBytes(48)
    .toString("hex");

  const hashedPassword = await bcrypt.hash(
    randomPassword,
    10
  );

  try {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      password: hashedPassword,
    });

    return user;
  } catch (error) {
    // Handle simultaneous first logins for the same email.
    if (error.code === 11000) {
      const existingUser = await User.findOne({ email });

      if (existingUser) return existingUser;
    }

    throw error;
  }
}

/* =====================================================
   CREATE ONE-TIME LOGIN TICKET
===================================================== */

function createOAuthTicket(userId) {
  const now = Date.now();

  for (const [ticket, value] of oauthTickets.entries()) {
    if (value.expiresAt <= now) {
      oauthTickets.delete(ticket);
    }
  }

  const ticket = crypto
    .randomBytes(32)
    .toString("hex");

  oauthTickets.set(ticket, {
    userId: String(userId),
    expiresAt: now + TICKET_TTL_MS,
  });

  return ticket;
}

async function finishOAuthLogin(res, identity) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const user = await findOrCreateOAuthUser(identity);
  const ticket = createOAuthTicket(user._id);

  return res.redirect(
    302,
    getFrontendRedirect({ oauth_code: ticket })
  );
}

/* =====================================================
   GOOGLE CALLBACK
===================================================== */

router.get("/google/callback", async (req, res) => {
  if (req.query.error) {
    clearStateCookie(res, "google");
    return redirectError(res, "provider_denied");
  }

  if (!validateOAuthState(req, res, "google")) {
    return redirectError(res, "invalid_state");
  }

  const code = String(req.query.code || "");

  if (!code) {
    return redirectError(res, "oauth_failed");
  }

  try {
    const credentials = getProviderCredentials("google");

    if (
      !credentials.clientId ||
      !credentials.clientSecret
    ) {
      return redirectError(res, "google_not_configured");
    }

    const tokenData = await fetchJson(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          redirect_uri: credentials.callbackUrl,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenData.access_token) {
      throw new Error(
        "Google did not return an access token."
      );
    }

    const profile = await fetchJson(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (
      !profile.sub ||
      !profile.email ||
      profile.email_verified !== true
    ) {
      throw new Error(
        "Google did not return a verified email address."
      );
    }

    return await finishOAuthLogin(res, {
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
    });
  } catch (error) {
    console.error(
      "Google OAuth callback failed:",
      error.message
    );

    return redirectError(res, "oauth_failed");
  }
});

/* =====================================================
   FACEBOOK CALLBACK
===================================================== */

router.get("/facebook/callback", async (req, res) => {
  if (req.query.error) {
    clearStateCookie(res, "facebook");
    return redirectError(res, "provider_denied");
  }

  if (!validateOAuthState(req, res, "facebook")) {
    return redirectError(res, "invalid_state");
  }

  const code = String(req.query.code || "");

  if (!code) {
    return redirectError(res, "oauth_failed");
  }

  try {
    const credentials =
      getProviderCredentials("facebook");

    if (
      !credentials.clientId ||
      !credentials.clientSecret
    ) {
      return redirectError(
        res,
        "facebook_not_configured"
      );
    }

    const tokenUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
    );

    tokenUrl.searchParams.set(
      "client_id",
      credentials.clientId
    );

    tokenUrl.searchParams.set(
      "client_secret",
      credentials.clientSecret
    );

    tokenUrl.searchParams.set(
      "redirect_uri",
      credentials.callbackUrl
    );

    tokenUrl.searchParams.set("code", code);

    const tokenData = await fetchJson(
      tokenUrl.toString()
    );

    if (!tokenData.access_token) {
      throw new Error(
        "Facebook did not return an access token."
      );
    }

    const profileUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/me`
    );

    profileUrl.searchParams.set(
      "fields",
      "id,name,email"
    );

    profileUrl.searchParams.set(
      "access_token",
      tokenData.access_token
    );

    const profile = await fetchJson(
      profileUrl.toString()
    );

    if (!profile.id || !profile.email) {
      throw new Error(
        "Facebook did not return an email address. Make sure the email permission is enabled."
      );
    }

    return await finishOAuthLogin(res, {
      provider: "facebook",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
    });
  } catch (error) {
    console.error(
      "Facebook OAuth callback failed:",
      error.message
    );

    return redirectError(res, "oauth_failed");
  }
});

/* =====================================================
   EXCHANGE ONE-TIME TICKET FOR CAREERLANE JWT
===================================================== */

router.post("/exchange", async (req, res) => {
  try {
    const code = String(req.body?.code || "");

    if (!/^[a-f0-9]{64}$/i.test(code)) {
      return res.status(400).json({
        message: "Invalid or missing login code.",
      });
    }

    const ticket = oauthTickets.get(code);

    // Tickets cannot be replayed.
    oauthTickets.delete(code);

    if (!ticket || ticket.expiresAt <= Date.now()) {
      return res.status(401).json({
        message:
          "Social login code expired. Please try again.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message:
          "Server authentication configuration is missing.",
      });
    }

    const user = await User.findById(ticket.userId);

    if (!user) {
      return res.status(401).json({
        message: "CareerLane account was not found.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Social login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "OAuth ticket exchange error:",
      error.message
    );

    return res.status(500).json({
      message: "Social login failed. Please try again.",
    });
  }
});

module.exports = router;