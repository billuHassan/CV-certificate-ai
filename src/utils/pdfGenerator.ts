import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface PdfExportOptions {
  filename?: string;
  format?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
  quality?: "standard" | "ultra";
  grayscale?: boolean;
  onProgress?: (progress: number, status: string) => void;
}

export interface PdfGenerationResult {
  pdf: jsPDF;
  blob: Blob;
  blobUrl: string;
  pageCount: number;
  filename: string;
}

export const PAGE_SPECS = {
  a4: {
    name: "A4",
    widthMm: 210,
    heightMm: 297,
    ratio: 297 / 210,
    description: "210 × 297 mm (International Standard)",
  },
  letter: {
    name: "US Letter",
    widthMm: 215.9,
    heightMm: 279.4,
    ratio: 279.4 / 215.9,
    description: "8.5 × 11 in (North American Standard)",
  },
} as const;

/**
 * Generates an authentic multi-page PDF Document from a DOM element
 */
export async function generateResumePdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<PdfGenerationResult> {
  const {
    filename = "Resume.pdf",
    format = "a4",
    orientation = "portrait",
    quality = "ultra",
    grayscale = false,
    onProgress,
  } = options;

  onProgress?.(15, "Capturing resume layout...");

  const spec = PAGE_SPECS[format] || PAGE_SPECS.a4;
  const scale = quality === "ultra" ? 2.5 : 1.75;

  // Render high-DPI canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  onProgress?.(50, "Calibrating PDF pages & layout...");

  const pageHeightPx = Math.floor(canvas.width * spec.ratio);
  const totalHeightPx = canvas.height;
  const pageCount = Math.max(1, Math.ceil(totalHeightPx / pageHeightPx));

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [spec.widthMm, spec.heightMm],
    compress: true,
  });

  for (let i = 0; i < pageCount; i++) {
    const progressPercent = 50 + Math.floor(((i + 1) / pageCount) * 40);
    onProgress?.(progressPercent, `Rendering PDF page ${i + 1} of ${pageCount}...`);

    const sliceY = i * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, totalHeightPx - sliceY);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = pageHeightPx;

    const ctx = sliceCanvas.getContext("2d");
    if (ctx) {
      // Solid white sheet background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

      // Draw the exact slice corresponding to this page
      ctx.drawImage(
        canvas,
        0,
        sliceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      // If user selected grayscale/monochrome mode for ATS or B&W printers
      if (grayscale) {
        const imgData = ctx.getImageData(0, 0, sliceCanvas.width, sliceCanvas.height);
        const d = imgData.data;
        for (let p = 0; p < d.length; p += 4) {
          const gray = Math.round(0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]);
          d[p] = gray;
          d[p + 1] = gray;
          d[p + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }

    if (i > 0) {
      pdf.addPage([spec.widthMm, spec.heightMm], orientation);
    }

    const imgDataUrl = sliceCanvas.toDataURL("image/jpeg", 0.96);
    pdf.addImage(imgDataUrl, "JPEG", 0, 0, spec.widthMm, spec.heightMm, undefined, "FAST");
  }

  onProgress?.(95, "Finalizing PDF metadata & encoding...");

  pdf.setProperties({
    title: filename.replace(/\.pdf$/i, ""),
    subject: "Professional Curriculum Vitae / Resume",
    creator: "CVCraft AI Resume Platform",
    keywords: "resume, cv, career, curriculum vitae",
  });

  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  onProgress?.(100, "PDF Ready!");

  return {
    pdf,
    blob,
    blobUrl,
    pageCount,
    filename: cleanFilename,
  };
}

/**
 * Downloads a generated resume PDF directly to the user's computer
 */
export async function downloadResumePdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<PdfGenerationResult> {
  const result = await generateResumePdf(element, options);
  
  // Trigger file download
  const link = document.createElement("a");
  link.href = result.blobUrl;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return result;
}
