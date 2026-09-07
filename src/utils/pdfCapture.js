import html2canvas from "html2canvas-pro";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Build fetch candidates for a photo URL so PDF capture works across
 * Vite (5173) ↔ Laravel (8000) without blank cross-origin images.
 */
function buildImageFetchCandidates(src) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return src ? [src] : [];
  }

  const candidates = [];
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

  try {
    const parsed = new URL(src, window.location.href);
    const path = parsed.pathname;

    // /storage/students/pictures/x.jpg → /api/media/students/pictures/x.jpg
    const storageMatch = path.match(/\/storage\/(.+)$/);
    if (storageMatch && apiBase) {
      candidates.push(`${apiBase}/media/${storageMatch[1]}`);
    }

    // Already an API media URL, or same-origin /storage via Vite proxy
    if (path.includes("/media/") && apiBase && !src.startsWith(apiBase)) {
      const mediaPath = path.replace(/^.*\/media\//, "");
      candidates.push(`${apiBase}/media/${mediaPath}`);
    }

    if (storageMatch) {
      candidates.push(`${window.location.origin}/storage/${storageMatch[1]}`);
    }

    candidates.push(parsed.href);
  } catch {
    candidates.push(src);
  }

  if (apiBase && src.startsWith("/")) {
    candidates.push(`${apiBase.replace(/\/api$/, "")}${src}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchImageAsDataUrl(src) {
  const candidates = buildImageFetchCandidates(src);

  for (const url of candidates) {
    if (url.startsWith("data:")) return url;

    try {
      const response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });
      if (!response.ok) continue;

      const blob = await response.blob();
      if (!blob || blob.size === 0) continue;

      return await blobToDataUrl(blob);
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Unable to load image for PDF: ${src}`);
}

/**
 * Replace <img> sources with same-origin data URLs so html2canvas can
 * paint student photos (cross-origin storage URLs otherwise stay blank).
 */
export async function inlineImagesForCapture(rootEl) {
  if (!rootEl) return;

  const images = Array.from(rootEl.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;

      try {
        const dataUrl = await fetchImageAsDataUrl(src);
        img.removeAttribute("crossorigin");
        img.crossOrigin = null;
        img.src = dataUrl;

        if (typeof img.decode === "function") {
          await img.decode().catch(() => {});
        } else if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      } catch (err) {
        console.warn("PDF image inline failed:", src, err);
      }
    })
  );
}

/**
 * Capture a DOM element to canvas. Uses html2canvas-pro so Tailwind v4
 * oklch/oklab/color-mix colors render instead of producing blank pages.
 */
export async function captureElement(el, options = {}) {
  if (!el) throw new Error("No element to capture");

  await inlineImagesForCapture(el);

  const images = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );

  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#ffffff",
    imageTimeout: 15000,
    ...options,
  });
}
