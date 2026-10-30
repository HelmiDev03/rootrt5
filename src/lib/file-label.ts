// "sujets/TP1_Design_Patterns.pdf" → { label: "sujets/TP1 Design Patterns", type: "PDF" }
export function describeFile(name: string) {
  const slash = name.lastIndexOf("/") + 1;
  const file = name.slice(slash);
  const dot = file.lastIndexOf(".");
  const base = dot > 0 ? file.slice(0, dot) : file;
  return { label: name.slice(0, slash) + base.replace(/[_-]+/g, " "), type: dot > 0 ? file.slice(dot + 1).toUpperCase() : "" };
}

// 3319489 → "3,2 Mo"
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

// URL of a file served by the site, e.g. /subject/tp1/enonce/TP1.pdf
export function servedFileUrl(base: string, path: string): string {
  return `${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
