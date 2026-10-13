import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Sparkles,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Layers,
  Columns,
  Maximize2,
  Minimize2,
  FileCheck,
} from "lucide-react";
import { ResumeData } from "../types";
import ResumeTemplates from "./ResumeTemplates";
import { generateResumePdf, downloadResumePdf, PAGE_SPECS, PdfGenerationResult } from "../utils/pdfGenerator";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  isPremium?: boolean;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  resume,
  isPremium = false,
}: PDFPreviewModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [format, setFormat] = useState<"a4" | "letter">("a4");
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [quality, setQuality] = useState<"standard" | "ultra">("ultra");
  const [viewMode, setViewMode] = useState<"continuous" | "single" | "spread">("continuous");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Export / generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [pdfResult, setPdfResult] = useState<PdfGenerationResult | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

  // References
  const renderSourceRef = useRef<HTMLDivElement>(null);
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const fullName = resume.personalInfo?.fullName?.trim() || "Candidate";
  const resumeTitle = resume.title?.trim() || "Resume";
  const templateId = resume.templateId || "modern";
  const defaultFilename = `${fullName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;

  // Calculate page count and multi-page metrics based on DOM measurements
  const updatePageMetrics = () => {
    if (!renderSourceRef.current) return;
    const el = renderSourceRef.current;
    const spec = PAGE_SPECS[format] || PAGE_SPECS.a4;
    const widthPx = el.offsetWidth || 794; // ~210mm at 96 DPI
    const pageHeightPx = Math.floor(widthPx * spec.ratio);
    const contentHeightPx = el.scrollHeight;
    const count = Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
    setPageCount(count);
  };

  // Re-generate / calibrate preview when modal opens or format changes
  useEffect(() => {
    if (isOpen) {
      // Allow DOM to settle, then calibrate
      const timer = setTimeout(() => {
        updatePageMetrics();
        handleBuildPdfBlob(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      // Clean up blob URL on close to prevent memory leaks
      if (pdfResult?.blobUrl) {
        URL.revokeObjectURL(pdfResult.blobUrl);
        setPdfResult(null);
      }
    }
  }, [isOpen, format, grayscale, quality]);

  // Recalibrate on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updatePageMetrics();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, format]);

  // Build the authentic PDF Blob in the background
  const handleBuildPdfBlob = async (notify = true) => {
    if (!renderSourceRef.current) return;
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStatus("Preparing document pages...");

    try {
      const result = await generateResumePdf(renderSourceRef.current, {
        filename: defaultFilename,
        format,
        grayscale,
        quality,
        onProgress: (prog, status) => {
          setGenerationProgress(prog);
          setGenerationStatus(status);
        },
      });

      setPdfResult(result);
      setPageCount(result.pageCount);
      setLastGeneratedAt(new Date());
    } catch (err) {
      console.error("Failed to compile PDF blob:", err);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };

  // Handle Download PDF button click
  const handleDownloadPdf = async () => {
    if (isGenerating) return;

    // If we already have a generated PDF result matching current settings, download it directly!
    if (pdfResult?.blobUrl) {
      const link = document.createElement("a");
      link.href = pdfResult.blobUrl;
      link.download = pdfResult.filename || defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!renderSourceRef.current) return;
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStatus("Generating high-resolution PDF...");

    try {
      const result = await downloadResumePdf(renderSourceRef.current, {
        filename: defaultFilename,
        format,
        grayscale,
        quality,
        onProgress: (prog, status) => {
          setGenerationProgress(prog);
          setGenerationStatus(status);
        },
      });

      setPdfResult(result);
      setPageCount(result.pageCount);
      setLastGeneratedAt(new Date());
    } catch (err) {
      console.error("Download PDF error:", err);
      // Fallback: trigger standard browser print dialog
      window.print();
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };

  // Print PDF directly
  const handlePrint = () => {
    if (pdfResult?.blobUrl) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfResult.blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 60000);
    } else {
      window.print();
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 45));
  const handleZoomReset = () => setZoom(100);
  const handleFitWidth = () => {
    if (!previewScrollContainerRef.current) return;
    const containerWidth = previewScrollContainerRef.current.clientWidth - 64;
    const sheetWidth = 794; // approx A4 width in px
    const targetZoom = Math.min(Math.max(Math.round((containerWidth / sheetWidth) * 100), 50), 160);
    setZoom(targetZoom);
  };
  const handleFitPage = () => {
    if (!previewScrollContainerRef.current) return;
    const containerHeight = previewScrollContainerRef.current.clientHeight - 80;
    const sheetHeight = 1123; // approx A4 height in px
    const targetZoom = Math.min(Math.max(Math.round((containerHeight / sheetHeight) * 100), 45), 120);
    setZoom(targetZoom);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "PageDown") {
        setCurrentPage((p) => Math.min(p + 1, pageCount));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentPage((p) => Math.max(p - 1, 1));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleZoomReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pageCount, onClose]);

  if (!isOpen) return null;

  const currentSpec = PAGE_SPECS[format] || PAGE_SPECS.a4;

  return (
    <div
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md transition-all ${
        isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"
      }`}
    >
      {/* Main Modal Shell */}
      <div
        className={`flex flex-col w-full h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${
          isFullscreen ? "rounded-none border-none" : ""
        }`}
      >
        {/* Mockup Studio Window Chrome Bar (matching Slideshow suite design) */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-600/50 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-600/50 shrink-0" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-600/50 shrink-0" />
            <span className="ml-2 font-mono text-[11px] text-slate-300 font-bold truncate">
              Rahmora Live Suite &bull; Real-Time PDF Studio Engine
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Live A4 / Letter Pagination
            </span>
          </div>
        </div>

        {/* ========================================== */}
        {/* TOP APP BAR / HEADER */}
        {/* ========================================== */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-3">
          {/* Document Title & Spec Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {fullName} • {resumeTitle}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-full shrink-0">
                  PDF Preview
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                <span className="font-medium text-slate-300 uppercase tracking-wider text-[10px]">
                  {currentSpec.name} ({currentSpec.widthMm} × {currentSpec.heightMm} mm)
                </span>
                <span>•</span>
                <span className="capitalize">{templateId} template</span>
                <span>•</span>
                <span className={pageCount === 1 ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                  {pageCount} {pageCount === 1 ? "Page (Optimal for ATS)" : "Pages"}
                </span>
                {lastGeneratedAt && (
                  <span className="hidden lg:inline text-slate-500">
                    • Synced {lastGeneratedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Print, Download PDF, Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
              title="Print document or use browser PDF driver"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Prominent Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
              title="Download high-resolution multi-page PDF"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Download className="h-4 w-4 text-white" />
              )}
              <span>{isGenerating ? "Exporting PDF..." : "Download PDF"}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close PDF Preview (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* SECONDARY TOOLBAR: Zoom, Layout, Settings */}
        {/* ========================================== */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-2 text-xs">
          {/* Left: Page Navigation Controls */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || viewMode === "continuous"}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-200 min-w-[70px] text-center">
              Page {viewMode === "continuous" ? `1 - ${pageCount}` : `${currentPage} of ${pageCount}`}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
              disabled={currentPage >= pageCount || viewMode === "continuous"}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* View Mode: Continuous vs Single Page vs Spread */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode("continuous")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  viewMode === "continuous" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Continuous vertical scroll of all pages"
              >
                <Layers className="h-3.5 w-3.5 inline mr-1" />
                <span className="hidden sm:inline">Continuous</span>
              </button>
              <button
                onClick={() => setViewMode("single")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  viewMode === "single" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="View one page at a time"
              >
                <FileCheck className="h-3.5 w-3.5 inline mr-1" />
                <span className="hidden sm:inline">Single</span>
              </button>
              {pageCount > 1 && (
                <button
                  onClick={() => setViewMode("spread")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    viewMode === "spread" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Side-by-side 2-page spread"
                >
                  <Columns className="h-3.5 w-3.5 inline mr-1" />
                  <span className="hidden sm:inline">Spread</span>
                </button>
              )}
            </div>
          </div>

          {/* Center / Right: Zoom & Export Settings */}
          <div className="flex items-center gap-2">
            {/* Quick Zoom presets */}
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                title="Zoom Out (Ctrl -)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white"
                title="Reset Zoom to 100% (Ctrl 0)"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                title="Zoom In (Ctrl +)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleFitWidth}
              className="hidden md:inline-block px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium rounded-lg border border-slate-700/60 transition"
              title="Fit to window width"
            >
              Fit Width
            </button>
            <button
              onClick={handleFitPage}
              className="hidden md:inline-block px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium rounded-lg border border-slate-700/60 transition"
              title="Fit entire page in view"
            >
              Fit Page
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            {/* Settings Drawer Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showSettings
                  ? "bg-indigo-950 border-indigo-700 text-indigo-300"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
              }`}
              title="Configure Paper Size, Quality, and Colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="font-semibold text-[11px]">Options</span>
            </button>

            {/* Refresh / Re-render */}
            <button
              onClick={() => handleBuildPdfBlob(true)}
              disabled={isGenerating}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
              title="Re-render PDF Preview"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* CONDITIONAL OPTIONS DRAWER */}
        {/* ========================================== */}
        {showSettings && (
          <div className="bg-slate-950/95 border-b border-slate-800 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-wrap items-center gap-5 text-xs">
              {/* Paper Size */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Paper Format:</span>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setFormat("a4")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      format === "a4" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    A4 (210×297 mm)
                  </button>
                  <button
                    onClick={() => setFormat("letter")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      format === "letter" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    US Letter (8.5×11 in)
                  </button>
                </div>
              </div>

              {/* Color Mode */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Color Mode:</span>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setGrayscale(false)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      !grayscale ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Full Color
                  </button>
                  <button
                    onClick={() => setGrayscale(true)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      grayscale ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Optimized for black & white printers and legacy ATS scanners"
                  >
                    Grayscale (ATS)
                  </button>
                </div>
              </div>

              {/* Render Quality */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Resolution:</span>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setQuality("ultra")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      quality === "ultra" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Ultra HD (300 DPI)
                  </button>
                  <button
                    onClick={() => setQuality("standard")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      quality === "standard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Standard (150 DPI)
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Real-time vector calibration & automatic multi-page slicing</span>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* GENERATION PROGRESS INDICATOR (IF ACTIVE)  */}
        {/* ========================================== */}
        {isGenerating && (
          <div className="bg-indigo-950/70 border-b border-indigo-900/50 px-4 py-2 shrink-0 flex items-center justify-between text-xs text-indigo-200 animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>{generationStatus || "Generating high-fidelity PDF document..."}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 h-1.5 bg-indigo-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 transition-all duration-200"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-indigo-300">{generationProgress}%</span>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* ONE-PAGE ATS ADVISORY BANNER               */}
        {/* ========================================== */}
        {pageCount > 1 && (
          <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2 shrink-0 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Your resume spans <strong>{pageCount} pages</strong>. For junior to mid-level roles, a 1-page layout is typically recommended by recruiters.
              </span>
            </div>
            <div className="text-[11px] text-amber-300 font-medium hidden sm:block">
              Tip: Switch spacing to 'Compact' or shorten bullet points to fit on 1 page.
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MAIN VIEWER CANVAS / BODY                  */}
        {/* ========================================== */}
        <div
          ref={previewScrollContainerRef}
          className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex flex-col items-center select-none"
          style={{ minHeight: "300px" }}
        >
          {/* Zoom Wrapper */}
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="flex flex-col items-center gap-8 my-2"
          >
            {/* The Visual A4/Letter Sheets */}
            {viewMode === "continuous" && (
              <div className="flex flex-col items-center gap-8">
                {Array.from({ length: pageCount }).map((_, idx) => (
                  <div key={idx} className="relative flex flex-col items-center group">
                    {/* Page Sheet Banner / Header */}
                    <div className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-mono">
                      <span>{currentSpec.name} Page {idx + 1} of {pageCount}</span>
                      <span className="text-[10px] text-slate-600">Export Ready</span>
                    </div>

                    {/* Physical Sheet Card */}
                    <div
                      className={`relative bg-white text-slate-900 shadow-2xl shadow-black/80 rounded-sm overflow-hidden border border-slate-700/50 ${
                        grayscale ? "filter grayscale contrast-105" : ""
                      }`}
                      style={{
                        width: format === "letter" ? "215.9mm" : "210mm",
                        minHeight: format === "letter" ? "279.4mm" : "297mm",
                        maxHeight: format === "letter" ? "279.4mm" : "297mm",
                      }}
                    >
                      {/* Viewport Slice for Page idx */}
                      <div
                        style={{
                          transform: `translateY(-${idx * (format === "letter" ? 279.4 : 297)}mm)`,
                          transformOrigin: "top left",
                          width: format === "letter" ? "215.9mm" : "210mm",
                        }}
                      >
                        <ResumeTemplates data={resume} />
                      </div>

                      {/* Bottom Page Number Watermark */}
                      <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                        {idx + 1} / {pageCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "single" && (
              <div className="relative flex flex-col items-center">
                <div className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-mono">
                  <span>{currentSpec.name} Page {currentPage} of {pageCount}</span>
                  <span className="text-[10px] text-slate-600">Single Page Inspection</span>
                </div>

                <div
                  className={`relative bg-white text-slate-900 shadow-2xl shadow-black/80 rounded-sm overflow-hidden border border-slate-700/50 ${
                    grayscale ? "filter grayscale contrast-105" : ""
                  }`}
                  style={{
                    width: format === "letter" ? "215.9mm" : "210mm",
                    minHeight: format === "letter" ? "279.4mm" : "297mm",
                    maxHeight: format === "letter" ? "279.4mm" : "297mm",
                  }}
                >
                  <div
                    style={{
                      transform: `translateY(-${(currentPage - 1) * (format === "letter" ? 279.4 : 297)}mm)`,
                      transformOrigin: "top left",
                      width: format === "letter" ? "215.9mm" : "210mm",
                    }}
                  >
                    <ResumeTemplates data={resume} />
                  </div>

                  <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                    {currentPage} / {pageCount}
                  </div>
                </div>
              </div>
            )}

            {viewMode === "spread" && (
              <div className="flex flex-wrap justify-center gap-6">
                {Array.from({ length: Math.min(pageCount, 2) }).map((_, idx) => (
                  <div key={idx} className="relative flex flex-col items-center">
                    <div className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-mono">
                      <span>Sheet {idx + 1}</span>
                    </div>

                    <div
                      className={`relative bg-white text-slate-900 shadow-2xl shadow-black/80 rounded-sm overflow-hidden border border-slate-700/50 ${
                        grayscale ? "filter grayscale contrast-105" : ""
                      }`}
                      style={{
                        width: format === "letter" ? "215.9mm" : "210mm",
                        minHeight: format === "letter" ? "279.4mm" : "297mm",
                        maxHeight: format === "letter" ? "279.4mm" : "297mm",
                      }}
                    >
                      <div
                        style={{
                          transform: `translateY(-${idx * (format === "letter" ? 279.4 : 297)}mm)`,
                          transformOrigin: "top left",
                          width: format === "letter" ? "215.9mm" : "210mm",
                        }}
                      >
                        <ResumeTemplates data={resume} />
                      </div>

                      <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                        {idx + 1} / {pageCount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* BOTTOM FOOTER STATUS BAR                   */}
        {/* ========================================== */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Real-Time PDF Ready</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              Candidate: <strong className="text-slate-200">{fullName}</strong>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline text-slate-400">
              Format: <strong className="text-slate-200">{currentSpec.description}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              Shortcut: <strong>Ctrl +</strong> / <strong>-</strong> to zoom • <strong>Esc</strong> to close
            </span>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN OFF-SCREEN SOURCE FOR HIGH-RES VECTOR/CANVAS PDF ENGINE            */}
      {/* ========================================================================= */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          ref={renderSourceRef}
          style={{
            width: format === "letter" ? "215.9mm" : "210mm",
            backgroundColor: "#ffffff",
            color: "#0f172a",
          }}
          className="p-0 m-0 bg-white text-slate-900"
        >
          <ResumeTemplates data={resume} />
        </div>
      </div>
    </div>
  );
}
