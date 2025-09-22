import React, { useRef, useEffect, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import { Controlled as ControlledTextarea } from "react-textarea-autosize";
import * as monaco from "monaco-editor";

const EditorComponent: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const editor = monaco.editor.create(editorRef.current!, {
      value: code,
      language: "javascript",
      theme: "vs-dark",
      fontSize: 14,
      minimap: { enabled: false },
    });

    editorRef.current = editor;

    return () => {
      editor?.dispose();
    };
  }, []);

  const handleCodeChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setCode(e.currentTarget.value);
  };

  const handleRunCode = () => {
    try {
      const result = eval(code);
      console.log(result);
    } catch (err) {
      console.error("Error:", (err as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-4 p-3 border-b">
        <button onClick={handleRunCode} className="px-3 py-1 bg-blue-600 text-white rounded">
          Run
        </button>
      </header>

      <div className="flex flex-1">
        <ControlledTextarea
          className="w-full h-full p-3 border-r"
          value={code}
          onChange={handleCodeChange}
        />
        <div className="w-1/3 p-3 border-l overflow-auto">
          <h3 className="font-semibold mb-2">Output</h3>
          <pre className="whitespace-pre-wrap">{/* Output goes here */}</pre>
        </div>
      </div>
    </div>
  );
};

export default EditorComponent;