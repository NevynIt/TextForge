import mermaid from "mermaid";

export async function renderMermaidSvg(id: string, source: string): Promise<string> {
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

  if (typeof document === "undefined") {
    const rendered = await mermaid.render(id, source);
    return rendered.svg;
  }

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "-10000px";
  host.style.overflow = "hidden";
  host.style.visibility = "hidden";
  host.style.pointerEvents = "none";

  document.body.append(host);
  try {
    const rendered = await mermaid.render(id, source, host);
    return rendered.svg;
  } finally {
    host.remove();
  }
}