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
  host.style.top = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.overflow = "hidden";

  document.body.append(host);
  try {
    const rendered = await mermaid.render(id, source, host);
    return rendered.svg;
  } finally {
    host.remove();
  }
}