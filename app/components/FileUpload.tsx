"use client";

import React from "react";
import styles from "./chat.module.css";

interface FileUploadProps {
  onUploaded: (file_id: string) => void;
}

export default function FileUpload({ onUploaded }: FileUploadProps) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload failed:", data);
        return;
      }

      if (data?.file_id) {
        onUploaded(data.file_id);
      } else {
        console.error("No file_id in response:", data);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  }

  return (
    <label className={styles.uploadButton}>
      📎
      <input
        type="file"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </label>
  );
}
