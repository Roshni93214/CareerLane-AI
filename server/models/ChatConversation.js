const mongoose = require("mongoose");

// =====================================================
// CHAT MESSAGE SCHEMA
// =====================================================

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// CHAT CONVERSATION SCHEMA
// =====================================================

const chatConversationSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      title: {
        type: String,
        default: "New Conversation",
        trim: true,
      },

      messages: {
        type: [chatMessageSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
  mongoose.models.ChatConversation ||
  mongoose.model(
    "ChatConversation",
    chatConversationSchema
  );