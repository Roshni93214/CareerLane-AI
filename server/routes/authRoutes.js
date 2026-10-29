const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/user");

const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Please enter your name.",
      });
    }

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({
        message: "Please enter your password.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email.",
      });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({
        message: "Please enter your password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // JWT secret check
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message:
          "Server authentication configuration is missing.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log(
      "User logged in successfully:",
      normalizedEmail
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(
      req.body?.email || ""
    ).trim().toLowerCase();

    // Validate email
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // Find user
    const user = await User.findOne({
      email,
    });

    // Do not reveal whether account exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }

    // =================================================
    // CHECK SMTP CONFIGURATION
    // =================================================

    const smtpUser =
      process.env.SMTP_USER ||
      process.env.EMAIL_USER;

    const smtpPass =
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASS;

    const smtpHost =
      process.env.SMTP_HOST ||
      "smtp.gmail.com";

    const smtpPort = Number(
      process.env.SMTP_PORT || 587
    );

    const smtpSecure =
      process.env.SMTP_SECURE !== undefined
        ? String(process.env.SMTP_SECURE).toLowerCase() === "true"
        : smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      console.error(
        "Password reset email failed: SMTP credentials are missing."
      );

      return res.status(500).json({
        message:
          "Password reset email service is not configured. Please configure SMTP credentials in the server .env file.",
      });
    }

    // =================================================
    // GENERATE SECURE RESET TOKEN
    // =================================================

    const rawToken = crypto
      .randomBytes(32)
      .toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Save hashed token
    user.resetPasswordToken = hashedToken;

    // Token valid for 30 minutes
    user.resetPasswordExpires =
      new Date(Date.now() + 30 * 60 * 1000);

    await user.save();

    // =================================================
    // CREATE RESET URL
    // =================================================

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    ).replace(/\/$/, "");

    const resetUrl =
      `${frontendUrl}/reset-password?token=${rawToken}`;

    // =================================================
    // CREATE SMTP TRANSPORTER
    // =================================================

    const transporter =
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

    // =================================================
    // SEND EMAIL
    // =================================================

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"CareerLane AI" <${smtpUser}>`,

        to: user.email,

        subject:
          "CareerLane AI — Reset Your Password",

        text: `
Hello ${user.name || ""},

We received a request to reset your CareerLane AI password.

Use the following link to create a new password:

${resetUrl}

This password reset link is valid for 30 minutes.

If you did not request this password reset, you can safely ignore this email.

CareerLane AI
        `.trim(),

        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CareerLane AI Password Reset</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#fbf2e1;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      padding:20px;
    "
  >

    <div
      style="
        background:#ffffff;
        border-radius:20px;
        padding:40px;
        border:1px solid rgba(11,71,69,0.14);
      "
    >

      <div
        style="
          text-align:center;
          margin-bottom:30px;
        "
      >

        <div
          style="
            display:inline-block;
            width:48px;
            height:48px;
            line-height:48px;
            border-radius:14px;
            background:#0b4745;
            color:#d2b68a;
            font-size:24px;
            font-weight:bold;
          "
        >
          ✦
        </div>

        <h1
          style="
            margin:15px 0 0;
            color:#173432;
            font-size:28px;
          "
        >
          Career<span style="color:#0b4745;">Lane</span>
        </h1>

      </div>

      <h2
        style="
          color:#173432;
          margin-bottom:12px;
        "
      >
        Reset Your Password
      </h2>

      <p
        style="
          color:#66756f;
          line-height:1.7;
          font-size:15px;
        "
      >
        Hello ${user.name || ""},
      </p>

      <p
        style="
          color:#66756f;
          line-height:1.7;
          font-size:15px;
        "
      >
        We received a request to reset your
        CareerLane AI account password.
      </p>

      <p
        style="
          color:#66756f;
          line-height:1.7;
          font-size:15px;
        "
      >
        Click the button below to create a new
        password.
      </p>

      <div
        style="
          text-align:center;
          margin:30px 0;
        "
      >

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            background:#0b4745;
            color:#ffffff;
            text-decoration:none;
            padding:14px 28px;
            border-radius:10px;
            font-weight:bold;
            font-size:15px;
          "
        >
          Reset Password
        </a>

      </div>

      <div
        style="
          background:#f8f3e8;
          border-radius:12px;
          padding:15px;
          margin:20px 0;
        "
      >

        <p
          style="
            margin:0;
            color:#66756f;
            font-size:13px;
            line-height:1.6;
          "
        >
          🔒 This password reset link will expire
          in <strong>30 minutes</strong>.
        </p>

      </div>

      <p
        style="
          color:#66756f;
          font-size:13px;
          line-height:1.6;
        "
      >
        If you did not request a password reset,
        you can safely ignore this email.
      </p>

      <hr
        style="
          border:0;
          border-top:1px solid #e8dfcf;
          margin:30px 0;
        "
      />

      <p
        style="
          text-align:center;
          color:#8a9893;
          font-size:12px;
          margin:0;
        "
      >
        © CareerLane AI — AI Career Guide
      </p>

    </div>

  </div>

</body>
</html>
        `.trim(),
      });

      console.log(
        "Password reset email sent successfully to:",
        user.email
      );

    } catch (emailError) {

      console.error(
        "SMTP email sending error:",
        emailError
      );

      // Remove token if email could not be sent
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();

      return res.status(500).json({
        message:
          "Unable to send password reset email. Please check the email service configuration.",
      });
    }

    // =================================================
    // IMPORTANT:
    // NEVER RETURN resetUrl TO FRONTEND
    // =================================================

    return res.status(200).json({
      message:
        "Password reset link has been sent to your email. Please check your inbox.",
    });

  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to process password reset. Please try again.",
    });
  }
});


// =====================================================
// RESET PASSWORD
// =====================================================

router.post("/reset-password", async (req, res) => {
  try {

    const token = String(
      req.body?.token || ""
    );

    const password = String(
      req.body?.password || ""
    );

    // Strong password validation
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Token validation
    if (!token) {
      return res.status(400).json({
        message:
          "Invalid or missing password reset link.",
      });
    }

    // Password validation
    if (!passwordPattern.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.",
      });
    }

    // Hash incoming reset token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid user/token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "This password reset link is invalid or has expired.",
      });
    }

    // Hash new password
    user.password =
      await bcrypt.hash(password, 10);

    // Invalidate reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.log(
      "Password reset successfully for:",
      user.email
    );

    return res.status(200).json({
      message:
        "Your password has been successfully updated.",
    });

  } catch (error) {

    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to reset password. Please try again.",
    });
  }
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;