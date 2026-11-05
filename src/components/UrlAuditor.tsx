import React, { useState } from 'react';
import { 
  Globe, 
  Github, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  ExternalLink, 
  Lock, 
  ArrowRight,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ProjectFile } from '../types/security';
import { fetchGitHubRepoFiles } from '../services/urlSecurityChecker';

interface UrlAuditorProps {
  onAddRepoFiles: (files: ProjectFile[]) => void;
  onRunLiveUrlAudit: (targetUrl: string) => void;
  isScanning: boolean;
}

export const UrlAuditor: React.FC<UrlAuditorProps> = ({
  onAddRepoFiles,
  onRunLiveUrlAudit,
  isScanning
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'repo' | 'live'>('repo');
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/basic-auth');
  const [liveUrl, setLiveUrl] = useState('https://api.example.com/v1/auth?token=demo_token');
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const [fetchError, setFetchError] = useState('');

  const sampleRepos = [
    { name: 'expressjs/basic-auth', url: 'https://github.com/expressjs/basic-auth', desc: 'Express authentication sample' },
    { name: 'auth0/node-auth0', url: 'https://github.com/auth0/node-auth0', desc: 'Node.js authentication SDK' },
    { name: 'expressjs/cors', url: 'https://github.com/expressjs/cors', desc: 'CORS middleware repository' }
  ];

  const sampleLiveUrls = [
    { name: 'Production Secured API', url: 'https://auth.cloudservices.io/api/v1/health', note: 'HTTPS + HSTS + Strict CSP' },
    { name: 'Legacy Insecure Endpoint', url: 'http://internal-portal.dev:8080/dashboard?token=secret123', note: 'Cleartext HTTP + Query Token Risk' },
    { name: 'Public Web App Portal', url: 'https://app.example.org/profile', note: 'Missing X-Frame-Options & CSP' }
  ];

  const handleFetchRepo = async () => {
    if (!repoUrl.trim()) return;
    setIsFetchingRepo(true);
    setFetchError('');
    setFetchStatus('Connecting to repository...');

    try {
      const files = await fetchGitHubRepoFiles(repoUrl, (msg) => setFetchStatus(msg));
      onAddRepoFiles(files);
      setFetchStatus(`Successfully ingested ${files.length} code files from repository.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch repository files';
      setFetchError(msg);
      setFetchStatus('');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleAuditLiveUrl = () => {
    if (!liveUrl.trim()) return;
    onRunLiveUrlAudit(liveUrl.trim());
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Sub-mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>URL & Repository Audit Hub</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {activeSubMode === 'repo' ? 'Import Code from GitHub Repository URL' : 'Audit Live Web App / API Endpoint URL'}
          </h2>
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubMode('repo')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubMode === 'repo'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>Import Git Repo URL</span>
          </button>
          <button
            onClick={() => setActiveSubMode('live')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubMode === 'live'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Audit Live URL Posture</span>
          </button>
        </div>
      </div>

      {/* Option 1: Git Repository URL Importer */}
      {activeSubMode === 'repo' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Paste any public GitHub repository URL. The auditor will automatically fetch the project's source code files (.js, .ts, .py, etc.) directly into your workspace for file-by-file AST security auditing.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={isFetchingRepo || isScanning}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleFetchRepo}
              disabled={isFetchingRepo || isScanning || !repoUrl.trim()}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shrink-0 ${
                isFetchingRepo || isScanning || !repoUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 cursor-pointer'
              }`}
            >
              {isFetchingRepo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span>Fetching Repo...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Ingest & Audit Code</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Repositories */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick Test Repositories:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleRepos.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setRepoUrl(sample.url)}
                  disabled={isFetchingRepo}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-left text-xs transition-colors"
                >
                  <div className="font-semibold text-cyan-400 truncate">{sample.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{sample.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Status / Feedback message */}
          {fetchStatus && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/80 rounded-lg text-xs text-cyan-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{fetchStatus}</span>
            </div>
          )}

          {fetchError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}
        </div>
      )}

      {/* Option 2: Live URL Posture & Defense Headers Auditor */}
      {activeSubMode === 'live' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Enter a live web application URL or API endpoint. The toolkit will passively audit the target's transport protocol, Content-Security-Policy, HSTS enforcement, Clickjacking defenses, and query token risks.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://example.com/api/v1/endpoint"
                disabled={isScanning}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleAuditLiveUrl}
              disabled={isScanning || !liveUrl.trim()}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shrink-0 ${
                isScanning || !liveUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 cursor-pointer'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Live URL Posture</span>
            </button>
          </div>

          {/* Quick Sample Live URLs */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick Live Target Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleLiveUrls.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setLiveUrl(sample.url)}
                  disabled={isScanning}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-left text-xs transition-colors"
                >
                  <div className="font-semibold text-white truncate">{sample.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono truncate mt-0.5">{sample.url}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{sample.note}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
