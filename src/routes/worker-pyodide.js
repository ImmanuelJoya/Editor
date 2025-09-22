// worker-pyodide.js
self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js');

// ✅ Use self.loadPyodide, NOT self.Pyodide.loadPyodide
self.loadPyodide().then(py => {
  self.pyodide = py;
  self.postMessage({ type: 'ready' });
});

self.onmessage = async function(e) {
  const { type, code } = e.data;

  if (type === 'run') {
    try {
      const result = await self.pyodide.runPythonAsync(code);
      self.postMessage({ type: 'output', result: String(result) });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
};