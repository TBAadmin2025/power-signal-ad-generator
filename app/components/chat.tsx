"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";

import VoiceInput from "./VoiceInput";
import FileUpload from "./FileUpload";

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

/* ==============================================
   Architect Advisor Config (Environment Variables)
   ============================================== */

const STARTERS: string[] = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_CHAT_STARTERS || "[]");
  } catch {
    return [];
  }
})();

const WELCOME_BLURB: string =
  process.env.NEXT_PUBLIC_WELCOME_BLURB || "";

const WELCOME_AUDIO: string =
  process.env.NEXT_PUBLIC_WELCOME_AUDIO || "";

/* ============================================== */

const Avatar = () => (
  <img
    src="/Architect-Advisor-chat-image.png"
    alt="Architect Advisor"
    className={styles.avatar}
  />
);

const Message = ({ role, text }: MessageProps) => {
  if (role === "user") {
    return <div className={styles.userMessage}>{text}</div>;
  }

  return (
    <div className={styles.assistantRow}>
      <Avatar />
      <div className={styles.assistantMessage}>
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
};

const Chat = () => {
  /* ===== State ===== */
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [threadId, setThreadId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  /* NEW — toggles recording UI vs input UI */
  const [isRecording, setIsRecording] = useState(false);

  /* ===== Audio Welcome ===== */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  /* ===== Scroll Handling ===== */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* ===== Thread Boot ===== */
  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, { method: "POST" });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  /* ===== Messaging ===== */

  const sendMessage = async (text: string) => {
    const response = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content: text }),
      }
    );

    const stream = AssistantStream.fromReadableStream(response.body);

    stream.on("textCreated", () =>
      setMessages((prev) => [...prev, { role: "assistant", text: "" }])
    );

    stream.on("textDelta", (delta: any) => {
      if (delta.value != null) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + delta.value },
          ];
        });
      }
    });

    stream.on("event", (event: any) => {
      if (event.event === "thread.run.completed") {
        setInputDisabled(false);
        setIsTyping(false);
      }
    });
  };

  const sendFileMessage = async (file_id: string) => {
    const response = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: "",
          file_id,
        }),
      }
    );

    const stream = AssistantStream.fromReadableStream(response.body);

    stream.on("textCreated", () =>
      setMessages((prev) => [...prev, { role: "assistant", text: "" }])
    );

    stream.on("textDelta", (delta: any) => {
      if (delta.value != null) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + delta.value },
          ];
        });
      }
    });

    stream.on("event", (event: any) => {
      if (event.event === "thread.run.completed") {
        setInputDisabled(false);
        setIsTyping(false);
      }
    });

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `📎 Uploaded file — ${file_id}` },
    ]);

    setInputDisabled(true);
    setIsTyping(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: userInput }]);
    setIsTyping(true);
    setInputDisabled(true);

    sendMessage(userInput);
    setUserInput("");
  };

  const handleStarterClick = (prompt: string) => {
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setIsTyping(true);
    setInputDisabled(true);
    sendMessage(prompt);
  };

  return (
    <div className={styles.chatContainer}>
      {/* ===== Header ===== */}
      <div className={styles.headerBar}>
        <img
          src="/Architect-Advisor-logo.png"
          alt="Architect Advisor Logo"
          className={styles.headerLogo}
        />
        <div className={styles.headerSubtitle}>By The Boss Architect</div>
        <div className={styles.headerTagline}>
          Your Fortune 500 Advisor – On Demand
        </div>
      </div>

      {/* ===== Intro Section (FIRST LOAD ONLY) ===== */}
      {messages.length === 0 && (
        <div style={{ padding: "24px 20px 8px 20px" }}>
          {/* Audio Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div className={styles.introAvatarWrap}>
              <Avatar />
            </div>

            <button
              type="button"
              onClick={toggleAudio}
              style={{
                background: "var(--aa-gold)",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "999px",
                fontSize: ".8rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                whiteSpace: "nowrap",
              }}
            >
              {isPlaying
                ? "⏸️  Pause message"
                : "▶️  Press play — Kendra has thoughts for you"}
            </button>

            <audio
              ref={audioRef}
              src={WELCOME_AUDIO}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Coaching Briefing */}
          <div
            style={{
              borderLeft: "4px solid var(--aa-gold)",
              borderRadius: "6px",
              padding: "0 0 0 20px",
              marginBottom: "32px",
              fontSize: ".92rem",
              lineHeight: "1.55",
              color: "var(--aa-text)",
            }}
          >
            <Markdown>{WELCOME_BLURB}</Markdown>
          </div>

          {/* Starter Title */}
          <div className={styles.startersTitle} style={{ marginTop: "16px" }}>
            Try this to get started:
          </div>
        </div>
      )}

      {/* ===== Starters ===== */}
      {messages.length === 0 && (
        <div className={styles.startersWrap}>
          {STARTERS.map((s, i) => (
            <button
              key={i}
              type="button"
              className={styles.starterBtn}
              onClick={() => handleStarterClick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ===== Messages ===== */}
      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <Message key={idx} role={msg.role} text={msg.text} />
        ))}

        {isTyping && (
          <div className={styles.assistantRow}>
            <Avatar />
            <div className={styles.typingBubble}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ===== Input Bar ===== */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        {/* Only show text input when NOT recording */}
        {!isRecording && (
          <input
            type="text"
            className={styles.input}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Talk to me"
          />
        )}

        {/* Voice */}
        <VoiceInput
          onStartRecording={() => setIsRecording(true)}
          onFinished={(text) => {
            setIsRecording(false);
            if (!text) return;
            setUserInput(text);
          }}
        />

        {/* File Upload */}
        <FileUpload
          onUploaded={(file_id) => {
            if (!file_id) return;
            sendFileMessage(file_id);
          }}
        />

        {/* Send */}
        <button type="submit" className={styles.button} disabled={inputDisabled}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
