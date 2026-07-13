import React, { useState, useEffect } from "react";
import { Sparkles, Printer, Copy, RefreshCw, Send, CheckCircle, ChevronLeft, Mail, Phone, MapPin, Download } from "lucide-react";
import { CoverLetterData, ResumeData } from "../types";
import { triggerRewarded, triggerInterstitial } from "./AdSystem";

interface CoverLetterBuilderProps {
  initialLetter: CoverLetterData;
  resumes: ResumeData[];
  onSave: (letter: CoverLetterData) => void;
  onBackToDashboard: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function CoverLetterBuilder({
  initialLetter,
  resumes,
  onSave,
  onBackToDashboard,
  isPremium,
  onUpgrade,
}: CoverLetterBuilderProps) {
  const [letter, setLetter] = useState<CoverLetterData>(initialLetter);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onSave(letter);
  }, [letter]);

  const updateSenderInfo = (field: string, value: string) => {
    setLetter((prev) => ({
      ...prev,
      senderInfo: { ...prev.senderInfo, [field]: value },
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLetter = async () => {
    if (!letter.jobTitle || !letter.recipientCompany) {
      alert("Please provide at least a Target Job Title and Company Name.");
      return;
    }

    const generateAction = async () => {
      setGenerating(true);
      try {
        // Find selected resume summary context
        let resumeContext = "";
        const selectedResume = resumes.find((r) => r.id === selectedResumeId);
        if (selectedResume && isPremium) {
          resumeContext = selectedResume.summary || `${selectedResume.personalInfo.fullName} is a professional ${selectedResume.personalInfo.jobTitle}`;
        }

        const response = await fetch("/api/ai/generate-cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: letter.jobTitle,
            company: letter.recipientCompany,
            recipientName: letter.recipientName,
            jobDescription: letter.jobDescription,
            senderName: letter.senderInfo.name,
            senderEmail: letter.senderInfo.email,
            senderPhone: letter.senderInfo.phone,
            resumeSummary: resumeContext,
            isPremium,
          }),
        });

        const data = await response.json();
        if (data.content) {
          setLetter((prev) => ({ ...prev, content: data.content }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setGenerating(false);
      }
    };

    if (isPremium) {
      generateAction();
    } else {
      triggerRewarded(() => {
        generateAction();
      });
    }
  };

  const handlePrint = () => {
    triggerInterstitial(() => {
      window.print();
    });
  };

  const handleDownloadHTML = () => {
    const container = document.getElementById("letter-preview-container");
    if (!container) {
      alert("Letter preview not found.");
      return;
    }

    const letterHtml = container.innerHTML;
    const title = letter.title || "Cover_Letter";
    const name = letter.senderInfo.name || "User";

    const fullPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - ${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&display=swap');
    
    body {
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      font-family: "Inter", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-shadow-none {
        box-shadow: none !important;
      }
      .print-border-none {
        border: none !important;
      }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center py-8 print:p-0 print:bg-white print:text-black">
  
  <!-- Interactive instructions bar -->
  <div class="no-print mb-8 max-w-[210mm] w-full bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
      <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-widest">CVCraft AI • Export Assistant</h3>
      <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
        This is a fully styled, offline-ready HTML version of your cover letter. Open this file in any browser and print (Ctrl+P) to save as a high-fidelity PDF document.
      </p>
    </div>
    <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer shrink-0">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- Main Letter Content Frame -->
  <div class="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl print:shadow-none print-shadow-none border border-slate-800/20 print-border-none rounded-sm overflow-hidden p-16">
    ${letterHtml}
  </div>

</body>
</html>`;

    const blob = new Blob([fullPageContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}_Cover_Letter.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(letter, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${(letter.senderInfo.name || "User").replace(/\s+/g, "_")}_Cover_Letter_Backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col no-print">
      {/* Top action header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <h2 className="text-sm font-bold text-white font-display">
            Cover Letter: <span className="text-indigo-400">{letter.title || "Untitled Cover Letter"}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Content"}
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-600/10"
            title="Download fully styled offline-ready HTML. Best format for printing or converting to PDF!"
          >
            <Download className="h-3.5 w-3.5" /> Download HTML (Get PDF)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition border border-slate-700"
            title="Open standard browser print dialog"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={handleDownloadJSON}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-lg transition border border-slate-700"
            title="Export raw cover letter data to a JSON backup file"
          >
            Backup JSON
          </button>
        </div>
      </div>

      {/* Split interface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-full lg:w-[450px] shrink-0 border-r border-slate-800 p-4 overflow-y-auto space-y-4 bg-slate-950 no-print">
          
          {/* Header Description */}
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Gemini Cover Letter Generator
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fill in targeted details about the role and company. Let Gemini write a highly-focused, professional, persuasive cover letter designed to get interviews.
            </p>
          </div>

          {/* Form details */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sender Information</h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Sender Full Name"
                value={letter.senderInfo.name}
                onChange={(e) => updateSenderInfo("name", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="email"
                placeholder="Sender Email"
                value={letter.senderInfo.email}
                onChange={(e) => updateSenderInfo("email", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Sender Phone"
                value={letter.senderInfo.phone}
                onChange={(e) => updateSenderInfo("phone", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Sender Location"
                value={letter.senderInfo.location}
                onChange={(e) => updateSenderInfo("location", e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>

            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Target Job / Recipient</h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Hiring Manager Name"
                value={letter.recipientName}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientName: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={letter.recipientCompany}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientCompany: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Job Title / Role"
                value={letter.jobTitle}
                onChange={(e) => setLetter((prev) => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Recipient Address"
                value={letter.recipientAddress || ""}
                onChange={(e) => setLetter((prev) => ({ ...prev, recipientAddress: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white"
              />
            </div>

            {resumes.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Link with Profile Resume Summary</label>
                  {!isPremium && (
                    <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5 font-bold">
                      👑 Premium Link
                    </span>
                  )}
                </div>
                <select
                  value={isPremium ? selectedResumeId : ""}
                  onChange={(e) => {
                    if (!isPremium) {
                      onUpgrade();
                    } else {
                      setSelectedResumeId(e.target.value);
                    }
                  }}
                  className={`w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-300 focus:outline-none ${
                    !isPremium ? "cursor-pointer border-amber-500/30 hover:border-amber-400" : ""
                  }`}
                >
                  <option value="">-- No Resume Context (General Template) --</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || "Untitled Resume"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Job Description Summary</label>
              <textarea
                value={letter.jobDescription || ""}
                onChange={(e) => setLetter((prev) => ({ ...prev, jobDescription: e.target.value }))}
                placeholder="Paste the key responsibilities or target job description to optimize match score..."
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-white font-mono"
                rows={3}
              />
            </div>

            <button
              onClick={handleGenerateLetter}
              disabled={generating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-600/10"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Gemini is Drafting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Draft Cover Letter
                </>
              )}
            </button>
          </div>

          {/* Letter Editor block */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manual Refinements</h5>
            <textarea
              value={letter.content}
              onChange={(e) => setLetter((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Your cover letter text will appear here. You can refine and edit directly..."
              className="w-full bg-slate-950 border border-slate-850 rounded p-3 text-xs text-slate-100 font-sans leading-relaxed"
              rows={15}
            />
          </div>
        </div>

        {/* Right Preview Pane */}
        <div className="flex-1 bg-slate-900 p-8 flex justify-center items-start overflow-y-auto print:bg-white print:p-0">
          <div id="letter-preview-container" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-16 space-y-6 print:shadow-none print:w-full print:p-0 font-sans">
            
            {/* Header info */}
            <div className="border-b pb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{letter.senderInfo.name || "Your Name"}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{letter.jobTitle || "Professional Title"}</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                {letter.senderInfo.email && <div className="flex items-center gap-1 justify-end"><Mail className="h-3 w-3" /> {letter.senderInfo.email}</div>}
                {letter.senderInfo.phone && <div className="flex items-center gap-1 justify-end"><Phone className="h-3 w-3" /> {letter.senderInfo.phone}</div>}
                {letter.senderInfo.location && <div className="flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" /> {letter.senderInfo.location}</div>}
              </div>
            </div>

            {/* Recipient block */}
            <div className="space-y-1 text-xs text-slate-700">
              <span className="text-slate-400 text-[10px] block font-mono">{letter.date || "Date"}</span>
              <div className="font-bold text-slate-900">{letter.recipientName || "Hiring Manager"}</div>
              <div className="font-semibold text-indigo-600">{letter.recipientCompany || "Company Name"}</div>
              {letter.recipientAddress && <div className="text-slate-500 text-[11px]">{letter.recipientAddress}</div>}
            </div>

            {/* Letter Content body */}
            <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap pt-4 font-sans">
              {letter.content || "Dear Hiring Manager,\n\n[Please fill in the target job details on the left and click 'Draft Cover Letter' to generate a professionally polished message here.]"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
