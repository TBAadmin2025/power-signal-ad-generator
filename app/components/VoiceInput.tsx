"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./voiceInput.module.css";

type Props = {
  onStartRecording?: () => void;
  onFinished: (text: string) => void;
};

const VoiceInput: React.FC<Props> = ({ onStartRecording, onFinished }) => {
  const [mode, setMode] = useState<"idle" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  /** ========== TIMER HELPERS ========== */
  const startTimer = () => {
    setSeconds(0);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /** ========== CLEANUP ========== */
  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // on unmount, stop recorder & mic
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cleanupStream();
      stopTimer();
    };
  }, []);

  /** ========== START RECORDING ========== */
  const startRecording = async () => {
    try {
      if (mode !== "idle") return;

      onStartRecording?.();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setMode("recording");
      startTimer();
    } catch (err) {
      console.error("Error starting recording:", err);
      setMode("idle");
      cleanupStream();
      stopTimer();
    }
  };

  /** ========== STOP RECORDING (❌ cancel) ========== */
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error("Error stopping recorder:", err);
    }

    chunksRef.current = [];
    setMode("idle");
    stopTimer();
    cleanupStream();
  };

  /** ========== FINISH RECORDING (✔️ transcribe) ========== */
  const finishRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setMode("processing");
    stopTimer();

    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        const formData = new FormData();
        formData.append("file", blob, "voice-input.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data?.text) {
          onFinished(data.text);
        }
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setMode("idle");
        cleanupStream();
      }
    };

    try {
      if (recorder.state === "recording") {
        recorder.stop();
      } else if (recorder.state === "inactive") {
        // Edge case: just trigger onstop manually if needed
        recorder.onstop && recorder.onstop(new Event("stop"));
      }
    } catch (err) {
      console.error("Error stopping for finish:", err);
      setMode("idle");
      cleanupStream();
    }
  };

  /** ========== RENDER ========== */
  if (mode === "idle") {
    return (
      <button
        type="button"
        className={styles.micButton}
        onClick={startRecording}
        title="Record voice"
      >
        🎤
      </button>
    );
  }

  if (mode === "recording") {
    return (
      <div className={styles.recordingBar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={stopRecording}
          title="Stop recording"
        >
          ❌
        </button>

        <div className={styles.waveWrapper}>
          <div className={styles.waveBars}>
            <span className={styles.waveBar}></span>
            <span className={styles.waveBar}></span>
            <span className={styles.waveBar}></span>
            <span className={styles.waveBar}></span>
            <span className={styles.waveBar}></span>
          </div>
          <span className={styles.timer}>{formatTime(seconds)}</span>
        </div>

        <button
          type="button"
          className={styles.iconButton}
          onClick={finishRecording}
          title="Finish & transcribe"
        >
          ✔️
        </button>
      </div>
    );
  }

  // processing
  return (
    <div className={styles.recordingBar}>
      <div className={styles.processingWrapper}>
        <div className={styles.spinner}></div>
        <span className={styles.processingText}>Transcribing…</span>
      </div>
    </div>
  );
};

export default VoiceInput;
