import React, { useEffect, useState, useRef } from "react";
import * as Babel from "@babel/standalone";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

declare global {
  interface Window {
    pyodideWorker: Worker | null;
  }
}

const PYODIDE_WORKER_URL = new URL("./worker-pyodide.js", import.meta.url).href;

function EditorComponent() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("# print('Hello Python')");
  const [output, setOutput] = useState("");
  const [isReady, setIsReady] = useState(false);
  const editorRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (editorContainerRef.current && !editorRef.current) {
      try {
        const state = EditorState.create({
          doc: code,
          extensions: [
            basicSetup,
            language === "python" ? python() : javascript({ jsx: true }),
            oneDark,
          ],
        });

        editorRef.current = new EditorView({
          state,
          parent: editorContainerRef.current,
        });

        editorRef.current.contentDOM.addEventListener("input", () => {
          setCode(editorRef.current!.state.doc.toString());
        });
      } catch (error) {
        console.error("Failed to initialize CodeMirror:", error);
        setOutput("Error: Failed to initialize editor");
      }
    }

    if (editorRef.current) {
      const newState = EditorState.create({
        doc: code,
        extensions: [
          basicSetup,
          language === "python" ? python() : javascript({ jsx: true }),
          oneDark,
        ],
      });
      editorRef.current.setState(newState);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [language]);

  // Pyodide worker setup with enhanced logging
  useEffect(() => {
    let worker: Worker | null = null;

    if (!window.pyodideWorker) {
      try {
        worker = new Worker(PYODIDE_WORKER_URL);
        window.pyodideWorker = worker;
        console.log("Pyodide worker initialized");
      } catch (error) {
        console.error("Failed to initialize Pyodide worker:", error);
        setOutput("Error: Failed to initialize Pyodide worker");
        return;
      }
    } else {
      worker = window.pyodideWorker;
    }

    const handleMessage = (e: MessageEvent) => {
      console.log("Worker message received:", e.data);
      if (e.data.type === "ready") {
        setIsReady(true);
        console.log("Pyodide worker is ready");
      } else if (e.data.type === "output") {
        setOutput(prev => prev + (e.data.result || "") + "\n");
      } else if (e.data.type === "error") {
        setOutput(prev => prev + "Error:\n" + (e.data.error || "Unknown error") + "\n");
      }
    };

    worker?.addEventListener("message", handleMessage);

    return () => {
      worker?.removeEventListener("message", handleMessage);
    };
  }, []);

  async function runCode() {
    setOutput("");

    if (language === "python" && isReady) {
      console.log("Running Python code:", code);
      window.pyodideWorker?.postMessage({ type: "run", code });
    } else if (language === "javascript") {
      try {
        const result = eval(code);
        setOutput(String(result ?? "✅ JS executed"));
      } catch (err) {
        setOutput("Error:\n" + (err as Error).message);
      }
    } else if (language === "react") {
      try {
        const compiled = Babel.transform(code, { presets: ["react", "env"] }).code;
        const fn = new Function("React", "ReactDOM", compiled!);
        const ReactDOM = await import("react-dom");
        fn(React, ReactDOM);
        setOutput("✅ React component rendered below ⬇");
      } catch (err) {
        setOutput("Error:\n" + (err as Error).message);
      }
    } else {
      setOutput("Error: Language not supported or worker not ready");
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center gap-4 p-3 border-b border-gray-700 bg-gray-800">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 bg-gray-700 text-white rounded"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="react">React (JSX)</option>
        </select>
        <button
          onClick={runCode}
          disabled={!isReady && language === "python"}
          className={`px-4 py-2 rounded text-white ${
            !isReady && language === "python"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Run
        </button>
      </header>

      <div className="flex flex-1">
        <div className="w-2/3 p-3 bg-gray-900">
          <div ref={editorContainerRef} className="h-full" />
        </div>
        <div className="w-1/3 p-3 border-l border-gray-700 bg-gray-800 overflow-auto">
          <h3 className="font-semibold mb-2 text-lg">Output</h3>
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
          {language === "react" && <div id="react-mount" />}
        </div>
      </div>
    </div>
  );
}

export default EditorComponent;