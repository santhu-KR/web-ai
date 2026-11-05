/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  Sliders, 
  FileCheck,
  FolderOpen,
  Globe,
  Cpu,
  FileCode,
  CheckCircle2,
  LogOut,
  LogIn,
  User,
  ChevronDown
} from 'lucide-react';
import { CyberScene3D } from './components/CyberScene3D';
import { ScannerProgressBar } from './components/ScannerProgressBar';
import { VulnerabilityCard } from './components/VulnerabilityCard';
import { ScanConfiguration } from './components/ScanConfiguration';
import { FileUploader } from './components/FileUploader';
import { UrlAuditor } from './components/UrlAuditor';
import { ControlDock } from './components/ControlDock';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { SAMPLE_TARGETS } from './data/sampleTargets';
import { ScanTarget, VulnerabilityFinding, ScanReport, ProjectFile } from './types/security';
import { analyzeTargetDefensively, analyzeProjectFilesDefensively, SCAN_STAGES } from './services/analyzer';
import { analyzeLiveUrlSecurity } from './services/urlSecurityChecker';
import { playProceduralSound } from './services/audio';

const INITIAL_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    name: 'catalog.ts',
    path: 'routes/catalog.ts',
    language: 'typescript',
    size: 640,
    uploadedAt: 'Preloaded',
    content: `// Express.js Route Handler - routes/catalog.ts
import { Router } from 'express';
const router = Router();

router.get('/search', async (req, res) => {
  const searchTerm = req.query.q;
  const sortBy = req.query.sortBy || 'id';

  // Danger: Unparameterized dynamic string concatenation in SQL (CWE-89)
  const query = "SELECT id, name, price, stock FROM products WHERE name LIKE '%" + searchTerm + "%' ORDER BY " + sortBy;
  const items = await db.query(query);

  res.json({ results: items });
});

export default router;`
  },
  {
    id: 'file-2',
    name: 'profileController.js',
    path: 'controllers/profileController.js',
    language: 'javascript',
    size: 512,
    uploadedAt: 'Preloaded',
    content: `// Profile Controller - controllers/profileController.js
export function renderUserProfile(user, container) {
  // Danger: Client DOM sink directly writing un-sanitized user bio to innerHTML (CWE-79)
  const bioCard = document.getElementById('user-bio-card');
  bioCard.innerHTML = "<div class='bio'>" + user.biographyHtml + "</div>";
  
  const queryTheme = new URLSearchParams(window.location.search).get('theme');
  if (queryTheme) {
    document.body.innerHTML += queryTheme;
  }
}`
  },
  {
    id: 'file-3',
    name: 'webhookService.ts',
    path: 'services/webhookService.ts',
    language: 'typescript',
    size: 580,
    uploadedAt: 'Preloaded',
    content: `// Outbound Webhook Service - services/webhookService.ts
export async function dispatchEventNotification(event, callbackUrl) {
  // Danger: Unvalidated outbound fetch allows attacker to target cloud metadata (169.254.169.254)
  // or internal localhost ports (127.0.0.1:8080) (CWE-918)
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return response.status;
}`
  },
  {
    id: 'file-4',
    name: 'security.ts',
    path: 'config/security.ts',
    language: 'typescript',
    size: 490,
    uploadedAt: 'Preloaded',
    content: `// Hardened Security Middleware - config/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
});`
  }
];

export default function App() {
  const { user, isAuthenticated, logout, incrementAuditCount } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Audit Mode: Project Files (upload one-by-one or batch) vs Project URL / Git Repo vs Scenarios
  const [auditMode, setAuditMode] = useState<'files' | 'url_repo' | 'scenarios'>('files');

  // Project Files state
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    try {
      const saved = localStorage.getItem('sentinel_project_files');
      return saved ? JSON.parse(saved) : INITIAL_PROJECT_FILES;
    } catch {
      return INITIAL_PROJECT_FILES;
    }
  });
  const [selectedFileId, setSelectedFileId] = useState<string>(INITIAL_PROJECT_FILES[0].id);

  // Save files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sentinel_project_files', JSON.stringify(projectFiles));
    } catch {
      // Storage quota or private browsing fallback
    }
  }, [projectFiles]);

  // Target & Scanner state
  const [currentTarget, setCurrentTarget] = useState<ScanTarget>(SAMPLE_TARGETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageName, setStageName] = useState(SCAN_STAGES[0].name);
  const [microTask, setMicroTask] = useState('');
  const [tokensAnalyzed, setTokensAnalyzed] = useState(0);
  const [rulesEvaluated, setRulesEvaluated] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Analysis Findings & Report
  const [findings, setFindings] = useState<VulnerabilityFinding[]>([]);
  const [latestReport, setLatestReport] = useState<ScanReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'scanner' | 'findings' | 'config'>('scanner');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [scanSpeed, setScanSpeed] = useState<'1x' | '2x'>('1x');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // References for scan execution cancellation & timers
  const abortSignalRef = useRef<{ aborted: boolean }>({ aborted: false });
  const timerRef = useRef<number | null>(null);

  // Track elapsed scan duration
  useEffect(() => {
    if (isScanning && !isPaused) {
      const start = Date.now() - elapsedMs;
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isScanning, isPaused]);

  // Execute Security Analysis across Project Files or Target URL
  const handleStartScan = async (specificFileIds?: string[]) => {
    setIsScanning(true);
    setIsPaused(false);
    setScanProgress(0);
    setStageIndex(0);
    setStageName(SCAN_STAGES[0].name);
    setTokensAnalyzed(0);
    setRulesEvaluated(0);
    setElapsedMs(0);
    setFindings([]);
    abortSignalRef.current = { aborted: false };

    if (soundEnabled) playProceduralSound('stage');

    try {
      let report: ScanReport;

      if (auditMode === 'files') {
        const targetFiles = specificFileIds 
          ? projectFiles.filter(f => specificFileIds.includes(f.id))
          : projectFiles;

        setMicroTask(`Initiating AST audit across ${targetFiles.length} project file(s)...`);

        report = await analyzeProjectFilesDefensively(
          targetFiles,
          (update) => {
            setStageIndex(update.stageIndex);
            setScanProgress(update.overallPercent);
            setStageName(update.stageName);
            setMicroTask(update.microTask);
            setTokensAnalyzed(update.tokensAnalyzed);
            setRulesEvaluated(update.rulesEvaluated);

            if (update.newFinding) {
              setFindings((prev) => [...prev, update.newFinding!]);
              if (soundEnabled) playProceduralSound('alert');
            } else {
              if (soundEnabled && Math.random() > 0.6) playProceduralSound('tick');
            }
          },
          abortSignalRef.current
        );

        // Update finding counts per file
        setProjectFiles(prev => prev.map(f => ({
          ...f,
          findingCount: report.findings.filter(fn => fn.filePath === f.path).length
        })));

      } else {
        setMicroTask('Initializing AST parser and endpoint vectors...');

        report = await analyzeTargetDefensively(
          currentTarget,
          (update) => {
            setStageIndex(update.stageIndex);
            setScanProgress(update.overallPercent);
            setStageName(update.stageName);
            setMicroTask(update.microTask);
            setTokensAnalyzed(update.tokensAnalyzed);
            setRulesEvaluated(update.rulesEvaluated);

            if (update.newFinding) {
              setFindings((prev) => [...prev, update.newFinding!]);
              if (soundEnabled) playProceduralSound('alert');
            } else {
              if (soundEnabled && Math.random() > 0.6) playProceduralSound('tick');
            }
          },
          abortSignalRef.current
        );
      }

      setLatestReport(report);
      setIsScanning(false);
      setScanProgress(100);
      setMicroTask(`Audit completed! Identified ${report.findings.length} weakness(es). Check the Findings tab for AI remediation.`);
      if (soundEnabled) playProceduralSound('complete');
      incrementAuditCount();

      if (report.findings.length > 0) {
        setTimeout(() => setActiveTab('findings'), 700);
      }
    } catch (err: unknown) {
      setIsScanning(false);
      const message = err instanceof Error ? err.message : 'Analysis halted';
      setMicroTask(`Analysis terminated: ${message}`);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleCancelScan = () => {
    abortSignalRef.current.aborted = true;
    setIsScanning(false);
    setIsPaused(false);
    setMicroTask('Audit cancelled by user.');
  };

  // File Uploader Handlers
  const handleAddFiles = (newFiles: ProjectFile[]) => {
    setProjectFiles(prev => [...prev, ...newFiles]);
    setMicroTask(`Added ${newFiles.length} new code file(s) to project.`);
  };

  const handleDeleteFile = (fileId: string) => {
    setProjectFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      if (selectedFileId === fileId && filtered[0]) {
        setSelectedFileId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleAddRepoFiles = (repoFiles: ProjectFile[]) => {
    setProjectFiles(prev => [...repoFiles, ...prev]);
    if (repoFiles[0]) setSelectedFileId(repoFiles[0].id);
    setAuditMode('files');
    setMicroTask(`Ingested ${repoFiles.length} file(s) from Git repository. Initiating automated AST audit...`);
    setTimeout(() => {
      handleStartScan(repoFiles.map(f => f.id));
    }, 400);
  };

  const handleRunLiveUrlAudit = async (targetUrl: string) => {
    setIsScanning(true);
    setIsPaused(false);
    setScanProgress(0);
    setStageIndex(0);
    setStageName('Connecting to Target Live URL');
    setTokensAnalyzed(0);
    setRulesEvaluated(0);
    setElapsedMs(0);
    setFindings([]);
    abortSignalRef.current = { aborted: false };

    if (soundEnabled) playProceduralSound('stage');

    try {
      const report = await analyzeLiveUrlSecurity(
        targetUrl,
        (update) => {
          setStageIndex(update.stageIndex);
          setScanProgress(update.overallPercent);
          setStageName(update.stageName);
          setMicroTask(update.microTask);
          setTokensAnalyzed(update.tokensAnalyzed);
          setRulesEvaluated(update.rulesEvaluated);

          if (update.newFinding) {
            setFindings((prev) => [...prev, update.newFinding!]);
            if (soundEnabled) playProceduralSound('alert');
          } else {
            if (soundEnabled && Math.random() > 0.6) playProceduralSound('tick');
          }
        },
        abortSignalRef.current
      );

      setLatestReport(report);
      setIsScanning(false);
      setScanProgress(100);
      setMicroTask(`Live URL audit completed. Identified ${report.findings.length} weakness(es). Check the Findings tab for AI remediation.`);
      if (soundEnabled) playProceduralSound('complete');
      incrementAuditCount();

      if (report.findings.length > 0) {
        setTimeout(() => setActiveTab('findings'), 700);
      }
    } catch (err: unknown) {
      setIsScanning(false);
      const message = err instanceof Error ? err.message : 'Audit failed';
      setMicroTask(`Live URL audit failed: ${message}`);
    }
  };

  // Toggle in-memory remediation patch
  const handleTogglePatch = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => {
        if (f.id === findingId) {
          const nextState = !f.remediated;
          // If associated with a project file, apply the patch to the file content
          if (f.filePath && nextState) {
            setProjectFiles(files => files.map(file => {
              if (file.path === f.filePath) {
                return {
                  ...file,
                  content: file.content.replace(
                    f.matchedPattern,
                    f.remediation.secureSnippet.split('\n')[1] || '// Secure parameterized binding applied'
                  )
                };
              }
              return file;
            }));
          }
          return { ...f, remediated: nextState };
        }
        return f;
      })
    );
  };

  const selectedFile = projectFiles.find(f => f.id === selectedFileId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050814] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. Full-Bleed 3D Cyber Defense Scene */}
      <CyberScene3D 
        isScanning={isScanning} 
        scanProgress={scanProgress} 
        threatCount={findings.filter(f => !f.remediated).length} 
      />

      {/* 2. Top Header HUD */}
      <header className="relative z-30 flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black tracking-wider text-white uppercase">
                Web Application Penetration Toolkit with AI
              </span>
              <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded font-bold">
                AUDITOR & DEFENSE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Upload project source files (.ts, .js, .py, .sql) for file-by-file AST vulnerability analysis
            </p>
          </div>
        </div>

        {/* Top-Right Audit Mode Switcher & Score */}
        <div className="flex items-center space-x-3">
          {/* Mode Switcher: Project Files vs Project URL / Git Repo vs Route Scenarios */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setAuditMode('files')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                auditMode === 'files'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Project Files ({projectFiles.length})</span>
            </button>
            <button
              onClick={() => setAuditMode('url_repo')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                auditMode === 'url_repo'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Project URL / Git</span>
            </button>
            <button
              onClick={() => setAuditMode('scenarios')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                auditMode === 'scenarios'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Scenarios</span>
            </button>
          </div>

          {latestReport && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-950 transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              <span>Score: {latestReport.overallScore}/100</span>
            </button>
          )}

          {/* User Profile / Login & Logout Component */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-1.5 px-2.5 rounded-lg text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-900 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-[11px] overflow-hidden">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-white leading-tight truncate max-w-[110px]">{user.name}</div>
                  <div className="text-[9px] text-cyan-400 leading-none truncate max-w-[110px]">{user.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs">
                  <div className="pb-2.5 mb-2.5 border-b border-slate-800">
                    <div className="font-bold text-white truncate">{user.name}</div>
                    <div className="text-slate-400 font-mono text-[11px] truncate">{user.email}</div>
                    <div className="inline-block mt-1.5 px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[10px] font-semibold">
                      {user.role}
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-300 pb-2.5 mb-2.5 border-b border-slate-800">
                    <div className="flex justify-between py-0.5 text-[11px]">
                      <span className="text-slate-400">Total Audits Run:</span>
                      <span className="font-mono font-bold text-cyan-400">{user.totalAuditsRun}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-[11px]">
                      <span className="text-slate-400">Auditor Status:</span>
                      <span className="font-bold text-emerald-400">Verified</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In / Login</span>
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Central Viewport Overlay */}
      <main className="relative z-30 flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-28">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Flagship Visual Progress Bar Component */}
          <ScannerProgressBar
            progressPercent={scanProgress}
            stageIndex={stageIndex}
            stageName={stageName}
            microTask={microTask}
            tokensAnalyzed={tokensAnalyzed}
            rulesEvaluated={rulesEvaluated}
            threatsDetected={findings.filter(f => !f.remediated).length}
            elapsedMs={elapsedMs}
            isPaused={isPaused}
            isScanning={isScanning}
            onPauseToggle={handlePauseToggle}
            onCancel={handleCancelScan}
          />

          {/* Tab 1: Scanner Main Hub & Configuration */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              {auditMode === 'files' ? (
                <>
                  {/* Multi-File Project Uploader & Auditor */}
                  <FileUploader
                    files={projectFiles}
                    selectedFileId={selectedFileId}
                    onSelectFile={setSelectedFileId}
                    onAddFiles={handleAddFiles}
                    onDeleteFile={handleDeleteFile}
                    onStartAudit={handleStartScan}
                    isScanning={isScanning}
                  />

                  {/* Active Selected File Code Preview & Quick Editor */}
                  {selectedFile && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
                          <FileCode className="w-4 h-4" />
                          <span className="font-bold text-white">{selectedFile.path}</span>
                          <span className="text-slate-500">({selectedFile.language})</span>
                        </div>
                        <button
                          onClick={() => handleStartScan([selectedFile.id])}
                          disabled={isScanning}
                          className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-bold transition-colors"
                        >
                          Audit This File Only
                        </button>
                      </div>

                      <textarea
                        value={selectedFile.content}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjectFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content: val } : f));
                        }}
                        disabled={isScanning}
                        rows={7}
                        className="w-full bg-slate-950 font-mono text-[11px] p-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded-lg leading-5 resize-y"
                        placeholder="Inspect or edit file code..."
                      />
                    </div>
                  )}
                </>
              ) : auditMode === 'url_repo' ? (
                <UrlAuditor
                  onAddRepoFiles={handleAddRepoFiles}
                  onRunLiveUrlAudit={handleRunLiveUrlAudit}
                  isScanning={isScanning}
                />
              ) : (
                <ScanConfiguration
                  currentTarget={currentTarget}
                  onSelectTarget={setCurrentTarget}
                  onUpdateTargetCode={(code) => setCurrentTarget(prev => ({ ...prev, endpointCodeSnippet: code }))}
                  onStartScan={handleStartScan}
                  isScanning={isScanning}
                />
              )}

              {/* Quick Summary of Active Findings if any */}
              {findings.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold text-slate-400 flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Detected Weaknesses in Project Code ({findings.length})</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('findings')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      View AI Explanations & Diff →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {findings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => setActiveTab('findings')}
                        className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <div className="text-xs font-bold text-white truncate">{finding.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {finding.filePath ? (
                              <span className="text-cyan-400">{finding.filePath}:{finding.lineNumber || 1} • </span>
                            ) : null}
                            <span>{finding.cwe}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          finding.remediated 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : finding.severity === 'critical'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {finding.remediated ? 'Fixed' : finding.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Findings & AI Remediation Diffs */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Project File Vulnerability Audit Findings</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    File-specific taint analysis, vulnerable line indicators, and verified secure code refactors.
                  </p>
                </div>

                <button
                  onClick={() => handleStartScan()}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-run Audit</span>
                </button>
              </div>

              {findings.length === 0 ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-white mb-1">
                    No Vulnerabilities Currently Logged
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    Upload your project files or click "Audit All Files" to inspect source code AST for common weaknesses (SQLi, XSS, SSRF).
                  </p>
                  <button
                    onClick={() => handleStartScan()}
                    disabled={isScanning}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-cyan-950 transition-colors"
                  >
                    Audit Project Files
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {findings.map((finding) => (
                    <VulnerabilityCard
                      key={finding.id}
                      finding={finding}
                      onTogglePatch={handleTogglePatch}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Target Code & Files / URL */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {auditMode === 'url_repo' ? (
                <UrlAuditor
                  onAddRepoFiles={handleAddRepoFiles}
                  onRunLiveUrlAudit={handleRunLiveUrlAudit}
                  isScanning={isScanning}
                />
              ) : (
                <FileUploader
                  files={projectFiles}
                  selectedFileId={selectedFileId}
                  onSelectFile={setSelectedFileId}
                  onAddFiles={handleAddFiles}
                  onDeleteFile={handleDeleteFile}
                  onStartAudit={handleStartScan}
                  isScanning={isScanning}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. Collapsible Bottom Control Dock */}
      <ControlDock
        isScanning={isScanning}
        scanProgress={scanProgress}
        threatCount={findings.filter(f => !f.remediated).length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={() => setShowReportModal(true)}
        hasReport={latestReport !== null}
        speed={scanSpeed}
        onSpeedToggle={() => setScanSpeed(scanSpeed === '1x' ? '2x' : '1x')}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)}
      />

      {/* 5. Comprehensive Security Audit Report Modal */}
      {latestReport && (
        <ReportModal
          report={latestReport}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* 6. Security Auditor Login / Register Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
