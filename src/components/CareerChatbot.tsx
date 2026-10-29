import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { apiUrl } from "../config";
import "../styles/CareerChatbot.css";

// =====================================================
// TYPES
// =====================================================

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface Attachment {
  name: string;
  mimeType: string;
  base64: string;
}

// =====================================================
// CAREERLANE AI CHATBOT
// =====================================================

function CareerChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(
    null
  );

  const [attachment, setAttachment] =
    useState<Attachment | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "Hi! I'm CareerLane AI 👋\n\nHow can I help you today?",
    },
  ]);

  const [attachmentLoading, setAttachmentLoading] =
    useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // =====================================================
  // OPEN NEW CHAT
  // =====================================================

  const handleNewChat = () => {
    setMessages([
      {
        role: "ai",
        content: "Hi! I'm CareerLane AI 👋\n\nHow can I help you today?",
      },
    ]);
    setConversationId(null);
    setMessage("");
    setAttachment(null);
    setLoading(false);
    setAttachmentLoading(false);
  };
  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =====================================================
  // FILE TO BASE64
  // =====================================================

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const result = reader.result as string;

          const base64 = result.split(",")[1];

          if (!base64) {
            reject(
              new Error("Unable to convert file.")
            );
            return;
          }

          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(
          new Error("Unable to read file.")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // =====================================================
  // SELECT FILE
  // =====================================================

  const handleFileSelect = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // 10 MB maximum
    if (file.size > 10 * 1024 * 1024) {
      alert(
        "Please select a file smaller than 10 MB."
      );

      event.target.value = "";

      return;
    }

    setAttachmentLoading(true);

    try {
      const base64 = await fileToBase64(file);

      setAttachment({
        name: file.name,
        mimeType:
          file.type ||
          "application/octet-stream",
        base64,
      });
    } catch (error) {
      console.error(
        "File attachment error:",
        error
      );

      alert(
        "Unable to attach this file."
      );
    } finally {
      setAttachmentLoading(false);

      event.target.value = "";
    }
  };

  // =====================================================
  // REMOVE ATTACHMENT
  // =====================================================

  const removeAttachment = () => {
    setAttachment(null);
  };

  // =====================================================
  // UPDATE LAST AI MESSAGE
  // =====================================================

  const updateLastAIMessage = (
    content: string
  ) => {
    setMessages((previousMessages) => {
      const updated = [...previousMessages];

      if (updated.length === 0) {
        return updated;
      }

      const lastIndex =
        updated.length - 1;

      updated[lastIndex] = {
        role: "ai",
        content,
      };

      return updated;
    });
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSend = async () => {
    const trimmedMessage =
      message.trim();

    if (
      (!trimmedMessage && !attachment) ||
      loading
    ) {
      return;
    }

    const token =
      localStorage.getItem("token");

    // ===================================================
    // LOGIN REQUIRED FOR SAVED MEMORY
    // ===================================================

    if (!token) {
      const guestMessage =
        trimmedMessage ||
        `📎 ${attachment?.name || "Attached file"}`;

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "user",
          content: guestMessage,
        },
        {
          role: "ai",
          content:
            "Please log in to use CareerLane AI with saved conversations and personalized memory.",
        },
      ]);

      setMessage("");
      setAttachment(null);

      return;
    }

    // ===================================================
    // DISPLAY USER MESSAGE
    // ===================================================

    let displayMessage =
      trimmedMessage;

    if (attachment) {
      displayMessage = displayMessage
        ? `${displayMessage}\n📎 ${attachment.name}`
        : `📎 ${attachment.name}`;
    }

    // ===================================================
    // ADD USER MESSAGE + EMPTY AI MESSAGE
    // ===================================================

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: displayMessage,
      },
      {
        role: "ai",
        content: "",
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      // =================================================
      // API REQUEST
      // =================================================

      const response = await fetch(
        apiUrl("/api/chat/ask"),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: trimmedMessage,

            conversationId:
              conversationId,

            attachment:
              attachment || null,
          }),
        }
      );

      // =================================================
      // ERROR RESPONSE
      // =================================================

      if (!response.ok) {
        let errorMessage =
          "Failed to get AI response.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.message ||
            errorMessage;
        } catch {
          // Response was not JSON
        }

        throw new Error(
          errorMessage
        );
      }

      // =================================================
      // CONVERSATION ID
      // =================================================

      const newConversationId =
        response.headers.get(
          "X-Conversation-Id"
        );

      if (newConversationId) {
        setConversationId(
          newConversationId
        );
      }

      // =================================================
      // STREAMING RESPONSE
      // =================================================

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this browser or server."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder("utf-8");

      let aiResponse = "";

      // =================================================
      // READ STREAM
      // =================================================

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(value, {
            stream: true,
          });

        if (!chunk) {
          continue;
        }

        aiResponse += chunk;

        updateLastAIMessage(
          aiResponse
        );
      }

      // =================================================
      // FLUSH DECODER
      // =================================================

      const remaining =
        decoder.decode();

      if (remaining) {
        aiResponse += remaining;

        updateLastAIMessage(
          aiResponse
        );
      }

      // =================================================
      // EMPTY RESPONSE
      // =================================================

      if (!aiResponse.trim()) {
        updateLastAIMessage(
          "Sorry, I couldn't generate a response. Please try again."
        );
      }
    } catch (error) {
      console.error(
        "CareerLane AI error:",
        error
      );

      updateLastAIMessage(
        "Sorry, I couldn't connect to CareerLane AI right now. Please make sure the backend server is running and try again."
      );
    } finally {
      setLoading(false);
      setAttachment(null);
    }
  };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSend();
    }
  };

  // =====================================================
  // CLEAR SAVED MEMORY
  // =====================================================

    // =====================================================
    // FORMAT INLINE MARKDOWN
    // =====================================================

    const formatInline = (
      text: string
    ): ReactNode[] => {
      let cleanedText = text;

    // Remove markdown horizontal separators
    cleanedText =
      cleanedText.replace(
        /^\s*[-*_]{3,}\s*$/,
        ""
      );

    // Convert escaped markdown
    cleanedText =
      cleanedText.replace(
        /\\([*_#])/g,
        "$1"
      );

    // Remove heading markers if they remain
    cleanedText =
      cleanedText.replace(
        /^#{1,6}\s+/,
        ""
      );

    const parts =
      cleanedText.split(
        /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
      );

    return parts.map(
      (part, index) => {
        if (
          part.startsWith("**") &&
          part.endsWith("**")
        ) {
          return (
            <strong
              key={index}
              className="chatbot-bold-text"
            >
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (
          part.startsWith("`") &&
          part.endsWith("`")
        ) {
          return (
            <code
              key={index}
              className="chatbot-inline-code"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        if (
          part.startsWith("*") &&
          part.endsWith("*")
        ) {
          return (
            <em key={index}>
              {part.slice(1, -1)}
            </em>
          );
        }

        return part;
      }
    );
  };

  // =====================================================
  // FORMAT AI RESPONSE
  // =====================================================

  const formatAIResponse = (
    content: string
  ): ReactNode[] => {
    const normalized =
      content
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    const lines =
      normalized.split("\n");

    const result: ReactNode[] = [];

    let bullets: string[] = [];

    let numberedItems: Array<{
      number: string;
      text: string;
    }> = [];

    let codeLines: string[] = [];

    let insideCodeBlock = false;

    let codeLanguage = "";

    // ===================================================
    // FLUSH BULLETS
    // ===================================================

    const flushBullets = () => {
      if (bullets.length === 0) {
        return;
      }

      result.push(
        <ul
          className="chatbot-response-list"
          key={`bullet-list-${result.length}`}
        >
          {bullets.map(
            (item, index) => (
              <li
                key={index}
              >
                {formatInline(item)}
              </li>
            )
          )}
        </ul>
      );

      bullets = [];
    };

    // ===================================================
    // FLUSH NUMBERED ITEMS
    // ===================================================

    const flushNumbered =
      () => {
        if (
          numberedItems.length ===
          0
        ) {
          return;
        }

        result.push(
          <ol
            className="chatbot-response-numbered-list"
            key={`numbered-list-${result.length}`}
          >
            {numberedItems.map(
              (item, index) => (
                <li
                  key={index}
                >
                  {formatInline(
                    item.text
                  )}
                </li>
              )
            )}
          </ol>
        );

        numberedItems = [];
      };

    // ===================================================
    // FLUSH CODE
    // ===================================================

    const flushCode = () => {
      if (codeLines.length === 0) {
        return;
      }

      result.push(
        <pre
          className="chatbot-code-block"
          key={`code-${result.length}`}
          data-language={
            codeLanguage || undefined
          }
        >
          <code>
            {codeLines.join("\n")}
          </code>
        </pre>
      );

      codeLines = [];
      codeLanguage = "";
    };

    // ===================================================
    // PROCESS LINES
    // ===================================================

    lines.forEach(
      (rawLine, index) => {
        const line =
          rawLine.trim();

        // ===============================================
        // CODE BLOCK
        // ===============================================

        if (
          line.startsWith("```")
        ) {
          if (!insideCodeBlock) {
            flushBullets();
            flushNumbered();

            insideCodeBlock = true;

            codeLanguage =
              line
                .replace(
                  /^```/,
                  ""
                )
                .trim();

            codeLines = [];
          } else {
            insideCodeBlock = false;

            flushCode();
          }

          return;
        }

        if (insideCodeBlock) {
          codeLines.push(
            rawLine
          );

          return;
        }

        // ===============================================
        // EMPTY LINE
        // ===============================================

        if (!line) {
          flushBullets();
          flushNumbered();

          return;
        }

        // ===============================================
        // HORIZONTAL RULE
        // ===============================================

        if (
          /^[-*_]{3,}$/.test(
            line
          )
        ) {
          flushBullets();
          flushNumbered();

          return;
        }

        // ===============================================
        // MARKDOWN HEADING
        // ===============================================

        if (
          /^#{1,6}\s+/.test(
            line
          )
        ) {
          flushBullets();
          flushNumbered();

          const heading =
            line.replace(
              /^#{1,6}\s+/,
              ""
            );

          result.push(
            <h4
              className="chatbot-response-heading"
              key={`heading-${index}`}
            >
              {formatInline(
                heading
              )}
            </h4>
          );

          return;
        }

        // ===============================================
        // BULLET
        // Supports:
        // - item
        // * item
        // • item
        // ===============================================

        const bulletMatch =
          line.match(
            /^[-*•]\s+(.+)$/
          );

        if (bulletMatch) {
          flushNumbered();

          bullets.push(
            bulletMatch[1]
          );

          return;
        }

        // ===============================================
        // NUMBERED LIST
        // Supports:
        // 1. item
        // 1) item
        // ===============================================

        const numberedMatch =
          line.match(
            /^(\d+)[.)]\s+(.+)$/
          );

        if (numberedMatch) {
          flushBullets();

          numberedItems.push({
            number:
              numberedMatch[1],
            text:
              numberedMatch[2],
          });

          return;
        }

        // ===============================================
        // NORMAL TEXT
        // ===============================================

        flushBullets();
        flushNumbered();

        result.push(
          <p
            className="chatbot-response-paragraph"
            key={`paragraph-${index}`}
          >
            {formatInline(line)}
          </p>
        );
      }
    );

    // ===================================================
    // FINAL FLUSH
    // ===================================================

    flushBullets();
    flushNumbered();

    if (insideCodeBlock) {
      flushCode();
    }

    return result;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* =================================================
          FLOATING BUTTON
      ================================================= */}

      {!isOpen && (
        <button
          type="button"
          className="career-chatbot-button"
          onClick={() =>
            setIsOpen(true)
          }
          aria-label="Open Ask CareerLane AI"
        >
          <span className="chatbot-button-icon">
            ✦
          </span>

          <span className="chatbot-button-text">
            Ask CareerLane AI
          </span>
        </button>
      )}

      {/* =================================================
          CHAT WINDOW
      ================================================= */}

      {isOpen && (
        <div className="career-chatbot-window">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="career-chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                ✦
              </div>

              <div>
                <h3>
                  Ask CareerLane AI
                </h3>

                <span>
                  Your intelligent AI assistant
                </span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {/* CLEAR MEMORY */}

              <button
  type="button"
  className="chatbot-action-button"
  onClick={handleNewChat}
  title="Start a new chat"
  aria-label="Start a new chat"
>
  ↺
</button>

              {/* CLOSE */}

              <button
                type="button"
                className="chatbot-close-button"
                onClick={() =>
                  setIsOpen(false)
                }
                aria-label="Close CareerLane AI"
              >
                ×
              </button>
            </div>
          </div>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="career-chatbot-messages">
            {messages.map(
              (
                chatMessage,
                index
              ) => (
                <div
                  key={index}
                  className={`chatbot-message ${
                    chatMessage.role ===
                    "user"
                      ? "chatbot-message-user"
                      : "chatbot-message-ai"
                  }`}
                >
                  {/* AI AVATAR */}

                  {chatMessage.role ===
                    "ai" && (
                    <div className="chatbot-message-avatar">
                      ✦
                    </div>
                  )}

                  {/* MESSAGE */}

                  <div className="chatbot-message-content">
                    {chatMessage.content ? (
                      chatMessage.role ===
                      "ai" ? (
                        formatAIResponse(
                          chatMessage.content
                        )
                      ) : (
                        <p className="chatbot-user-text">
                          {
                            chatMessage.content
                          }
                        </p>
                      )
                    ) : (
                      loading &&
                      chatMessage.role ===
                        "ai" && (
                        <div className="chatbot-loading">
                          <span />
                          <span />
                          <span />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}

            <div
              ref={messagesEndRef}
            />
          </div>

          {/* =================================================
              ATTACHMENT PREVIEW
          ================================================= */}

          {attachment && (
            <div className="chatbot-attachment-preview">
              <div className="chatbot-attachment-info">
                <span className="chatbot-attachment-icon">
                  📎
                </span>

                <span className="chatbot-attachment-name">
                  {attachment.name}
                </span>
              </div>

              <button
                type="button"
                onClick={
                  removeAttachment
                }
                aria-label="Remove attachment"
              >
                ×
              </button>
            </div>
          )}

          {/* =================================================
              INPUT AREA
          ================================================= */}

          <div className="career-chatbot-input-area">
            {/* HIDDEN FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              className="chatbot-file-input"
              accept="
                image/*,
                .pdf,
                .txt,
                .md,
                .json,
                .js,
                .jsx,
                .ts,
                .tsx,
                .css,
                .html,
                .py,
                .java,
                .c,
                .cpp
              "
              onChange={
                handleFileSelect
              }
            />

            {/* ATTACH BUTTON */}

            <button
              type="button"
              className="chatbot-attach-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                loading ||
                attachmentLoading
              }
              title="Attach image or file"
              aria-label="Attach image or file"
            >
              {attachmentLoading
                ? "..."
                : "📎"}
            </button>

            {/* TEXT INPUT */}

            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask CareerLane AI anything..."
              aria-label="Ask CareerLane AI"
              disabled={loading}
            />

            {/* SEND */}

            <button
              type="button"
              onClick={
                handleSend
              }
              disabled={
                (!message.trim() &&
                  !attachment) ||
                loading
              }
              aria-label="Send message"
            >
              {loading
                ? "..."
                : "→"}
            </button>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="career-chatbot-footer">
            CareerLane AI can make mistakes. Verify
            important information.
          </div>
        </div>
      )}
    </>
  );
}

export default CareerChatbot;
