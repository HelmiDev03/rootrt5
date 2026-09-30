// Runs Python inside the browser for the code view of the RT5 site, with Pyodide (CPython in WebAssembly).
// The worker stays alive between runs so Python loads once; stopping a run terminates it.
// 0.29.x (Python 3.13): the newer 314.x script does not load in a worker (importScripts fails).
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
importScripts(PYODIDE + "pyodide.js");

let pyodide = null;
let runs = 0;

const post = (message) => self.postMessage(message);

// Runs the file as "python <file>" from its folder, then forgets the modules it imported,
// so the next run sees the current version of the files.
const RUN = `
import os, runpy, sys, traceback

def __rt5_run(path):
    folder = os.path.dirname(path)
    before = set(sys.modules)
    os.chdir(folder)
    sys.path.insert(0, folder)
    sys.argv = [path]
    code = 0
    try:
        runpy.run_path(path, run_name="__main__")
    except SystemExit as error:
        code = error.code if isinstance(error.code, int) else (0 if error.code is None else 1)
        if not isinstance(error.code, int) and error.code is not None:
            print(error.code, file=sys.stderr)
    except BaseException as error:
        tb = error.__traceback__
        while tb is not None and not tb.tb_frame.f_code.co_filename.startswith(folder):
            tb = tb.tb_next
        traceback.print_exception(type(error), error, tb)
        if isinstance(error, EOFError):
            print("→ Ce programme lit des lignes avec input() : écrivez-les dans l'onglet « Entrée » du panneau.", file=sys.stderr)
        code = 1
    finally:
        sys.path.remove(folder)
        for name in set(sys.modules) - before:
            del sys.modules[name]
    sys.stdout.flush()
    sys.stderr.flush()
    return code
`;

self.onmessage = async (event) => {
  const { type, files, entry, stdin } = event.data;
  if (type !== "run") return;
  try {
    if (!pyodide) {
      post({ type: "status", text: "Chargement de Python dans le navigateur (la première fois : quelques secondes)…" });
      pyodide = await loadPyodide({ indexURL: PYODIDE });
      await pyodide.runPythonAsync(RUN);
    }
    pyodide.setStdout({ batched: (text) => post({ type: "output", text: text + "\n" }) });
    pyodide.setStderr({ batched: (text) => post({ type: "output", stream: "stderr", text: text + "\n" }) });
    const lines = stdin ? stdin.split(/\r?\n/) : [];
    pyodide.setStdin({ stdin: () => (lines.length ? lines.shift() : null) });

    // Copy the work's Python and data files into Python's file system.
    const folder = `/home/pyodide/run${++runs}`;
    let sources = "";
    for (const file of files) {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error(`Impossible de charger ${file.path}`);
      const data = new Uint8Array(await res.arrayBuffer());
      const target = `${folder}/${file.path}`;
      pyodide.FS.mkdirTree(target.slice(0, target.lastIndexOf("/")));
      pyodide.FS.writeFile(target, data);
      if (file.path.endsWith(".py")) sources += new TextDecoder().decode(data) + "\n";
    }
    // Packages available for Pyodide (numpy, pandas…) are loaded when the code imports them.
    await pyodide.loadPackagesFromImports(sources, { messageCallback: () => {} });

    post({ type: "status", text: `Exécution de ${entry}` });
    const code = pyodide.globals.get("__rt5_run")(`${folder}/${entry}`);
    post({ type: "exit", code });
  } catch (error) {
    post({ type: "output", stream: "stderr", text: String(error?.message ?? error) + "\n" });
    post({ type: "exit", code: 1 });
  }
};
