const express = require("express");

const ChatConversation = require("../models/ChatConversation");
const protect = require("../middleware/authMiddleware");

const {
  askCareerLaneAI,
} = require("../services/geminiService");

const router = express.Router();


// =====================================================
// ASK CAREERLANE AI
// STREAMING + MEMORY + ATTACHMENTS
// =====================================================

router.post("/ask", protect, async (req, res) => {
  try {
    const {
      message,
      conversationId,
      resumeText,
      analysis,
      attachment,
    } = req.body;

    // =================================================
    // VALIDATE MESSAGE / ATTACHMENT
    // =================================================

    if (
      (!message || !message.trim()) &&
      !attachment
    ) {
      return res.status(400).json({
        message:
          "Please enter a question or attach a file.",
      });
    }

    // =================================================
    // LOGGED-IN USER
    // =================================================

    const userId = req.user.userId;

    console.log(
      "CareerLane AI question:",
      message || "[Attachment only]"
    );

    console.log(
      "User ID:",
      userId
    );

    // =================================================
    // FIND EXISTING CONVERSATION
    // =================================================

    let conversation = null;

    if (conversationId) {
      conversation =
        await ChatConversation.findOne({
          _id: conversationId,
          user: userId,
        });
    }

    // =================================================
    // CREATE NEW CONVERSATION
    // =================================================

    if (!conversation) {
      const conversationTitle =
        message && message.trim()
          ? message.trim().slice(0, 60)
          : attachment?.name
            ? `Discussion about ${attachment.name}`
            : "New Conversation";

      conversation =
        new ChatConversation({
          user: userId,

          title:
            conversationTitle,

          messages: [],
        });

      await conversation.save();

      console.log(
        "New CareerLane conversation created:",
        conversation._id.toString()
      );
    }

    // =================================================
    // CURRENT CONVERSATION HISTORY
    // =================================================

    const currentHistory =
      conversation.messages
        .slice(-20)
        .map((chatMessage) => ({
          role:
            chatMessage.role === "ai"
              ? "model"
              : "user",

          content:
            chatMessage.content,
        }));

    // =================================================
    // PREVIOUS CONVERSATIONS MEMORY
    // =================================================

    let memoryMessages = [];

    try {
      const previousConversations =
        await ChatConversation.find({
          user: userId,

          _id: {
            $ne: conversation._id,
          },
        })
          .sort({
            updatedAt: -1,
          })
          .limit(5)
          .select(
            "messages updatedAt"
          );

      for (
        const previousConversation of previousConversations
      ) {
        if (
          previousConversation.messages &&
          previousConversation.messages.length > 0
        ) {
          const previousMessages =
            previousConversation.messages
              .slice(-6)
              .map((chatMessage) => ({
                role:
                  chatMessage.role,

                content:
                  chatMessage.content,
              }));

          memoryMessages.push(
            ...previousMessages
          );
        }
      }

      // Keep memory limited
      memoryMessages =
        memoryMessages.slice(-20);

    } catch (memoryError) {
      console.error(
        "Chat memory retrieval error:",
        memoryError
      );

      // Do not stop the chat if memory retrieval fails
      memoryMessages = [];
    }

    // =================================================
    // PREPARE USER MESSAGE
    // =================================================

    let userContent =
      message && message.trim()
        ? message.trim()
        : "";

    if (attachment) {
      const attachmentText =
        `📎 Attached file: ${attachment.name}`;

      userContent =
        userContent
          ? `${userContent}\n${attachmentText}`
          : attachmentText;
    }

    // =================================================
    // SAVE USER MESSAGE
    // =================================================

    conversation.messages.push({
      role: "user",
      content: userContent,
    });

    await conversation.save();

    console.log(
      "User message saved to MongoDB."
    );

    // =================================================
    // ASK GEMINI
    // =================================================

    const responseStream =
      await askCareerLaneAI({
        message:
          message?.trim() || "",

        resumeText:
          resumeText || "",

        analysis:
          analysis || null,

        currentHistory,

        memoryMessages,

        attachment:
          attachment || null,
      });

    // =================================================
    // STREAMING HEADERS
    // =================================================

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Transfer-Encoding",
      "chunked"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    // =================================================
    // SEND CONVERSATION ID TO FRONTEND
    // =================================================

    res.setHeader(
      "X-Conversation-Id",
      conversation._id.toString()
    );

    // =================================================
    // STREAM GEMINI RESPONSE
    // =================================================

    let aiResponse = "";

    for await (
      const chunk of responseStream
    ) {
      const geminiText =
        typeof chunk.text === "function"
          ? chunk.text()
          : chunk.text;

      const groqText =
        chunk?.choices?.[0]?.delta?.content || "";

      const text = geminiText || groqText;

      if (!text) {
        continue;
      }

      aiResponse += text;

      res.write(text);
    }

    // =================================================
    // SAVE AI RESPONSE
    // =================================================

    if (aiResponse.trim()) {
      conversation.messages.push({
        role: "ai",
        content:
          aiResponse.trim(),
      });

      await conversation.save();

      console.log(
        "AI response saved to MongoDB."
      );
    }

    // =================================================
    // FINISH STREAM
    // =================================================

    res.end();

  } catch (error) {
    console.error(
      "CareerLane AI streaming error:",
      error
    );

    // =================================================
    // STREAM ALREADY STARTED
    // =================================================

    if (res.headersSent) {
      res.end();
      return;
    }

    // =================================================
    // SERVER ERROR
    // =================================================

    return res.status(500).json({
      message:
        "Failed to get AI response.",

      error:
        error.message,
    });
  }
});


// =====================================================
// GET LATEST CHAT HISTORY
// =====================================================
// Used by the Refresh button.
//
// It loads the latest saved conversation of the
// currently logged-in user.
// =====================================================

router.get(
  "/history",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.userId;

      // =================================================
      // FIND LATEST CONVERSATION
      // =================================================

      const conversation =
        await ChatConversation.findOne({
          user: userId,
        }).sort({
          updatedAt: -1,
        });

      // =================================================
      // NO SAVED CONVERSATION
      // =================================================

      if (!conversation) {
        return res.status(200).json({
          message:
            "No previous conversation found.",

          conversation: null,
        });
      }

      // =================================================
      // RETURN CONVERSATION
      // =================================================

      return res.status(200).json({
        message:
          "Conversation history loaded successfully.",

        conversation: {
          id:
            conversation._id,

          title:
            conversation.title,

          messages:
            conversation.messages,

          createdAt:
            conversation.createdAt,

          updatedAt:
            conversation.updatedAt,
        },
      });

    } catch (error) {
      console.error(
        "Chat history error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load chat history.",

        error:
          error.message,
      });
    }
  }
);


// =====================================================
// GET SPECIFIC CONVERSATION
// =====================================================
// Allows the frontend to load a particular saved chat.
// =====================================================

router.get(
  "/history/:conversationId",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.userId;

      const {
        conversationId,
      } = req.params;

      // =================================================
      // FIND CONVERSATION
      // =================================================

      const conversation =
        await ChatConversation.findOne({
          _id: conversationId,
          user: userId,
        });

      // =================================================
      // NOT FOUND
      // =================================================

      if (!conversation) {
        return res.status(404).json({
          message:
            "Conversation not found.",
        });
      }

      // =================================================
      // RETURN CONVERSATION
      // =================================================

      return res.status(200).json({
        message:
          "Conversation loaded successfully.",

        conversation: {
          id:
            conversation._id,

          title:
            conversation.title,

          messages:
            conversation.messages,

          createdAt:
            conversation.createdAt,

          updatedAt:
            conversation.updatedAt,
        },
      });

    } catch (error) {
      console.error(
        "Specific conversation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load conversation.",

        error:
          error.message,
      });
    }
  }
);


// =====================================================
// CLEAR ALL CHAT MEMORY
// =====================================================
// Deletes all saved conversations for the logged-in user.
// =====================================================

router.delete(
  "/history",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.userId;

      // =================================================
      // DELETE ALL CONVERSATIONS
      // =================================================

      await ChatConversation.deleteMany({
        user: userId,
      });

      console.log(
        "CareerLane AI memory cleared for user:",
        userId
      );

      // =================================================
      // SUCCESS
      // =================================================

      return res.status(200).json({
        message:
          "CareerLane AI memory cleared successfully.",
      });

    } catch (error) {
      console.error(
        "Clear chat memory error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to clear chat memory.",
      });
    }
  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;