// Supported languages for the Monaco editor and runner
export type Language = "python" | "javascript" | "react";

// Optional: interface for a saved notebook/file
export interface NotebookFile {
  id: string;
  name: string;
  language: Language;
  content: string;
  updatedAt: string;
}