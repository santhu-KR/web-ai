import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  FileText,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { ScanReport } from '../types/security';

interface ReportModalProps {
  report: ScanReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  report, 
  isOpen, 
  onClose 
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    return `# Web Application Penetration Toolkit with AI - Security Audit Report

**Target URL:** ${report.targetUrl}  
**Method:** ${report.method}  
**Scan Timestamp:** ${report.timestamp}  
**Audit Duration:** ${report.durationMs}ms  
**Overall Security Score:** ${report.overallScore}/100 (Grade: ${report.grade})  

---

## 1. Executive Summary
The AI-driven security analysis identified **${report.findings.length} security weakness(es)** in the audited endpoint.

${report.findings.map((f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title} (${f.cwe})
- **OWASP Category:** ${f.owaspCategory}
- **Vulnerable Parameter:** ${f.parameter || 'N/A'}
- **Pattern:** \`${f.matchedPattern}\`

**AI Explanation:**
${f.aiExplanation}

**Remediation:**
\`\`\`${f.remediation.language}
${f.remediation.secureSnippet}
\`\`\`
`).join('\n')}

---

## 2. Recommended HTTP Defense Headers
${report.recommendedHeaders.map(h => `- **${h.name}:** \`${h.recommendedValue}\`  
  *${h.reason}*`).join('\n')}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentinel-audit-${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getGradeColor = () => {
    switch (report.grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
      case 'B':
        return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40';
      case 'C':
        return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
      default:
        return 'text-rose-400 border-rose-500/50 bg-rose-950/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Defensive Security Audit Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ID: {report.id} • {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Score & Grade Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-14 h-14 rounded-xl border flex items-center justify-center font-mono text-2xl font-black ${getGradeColor()}`}>
                {report.grade}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Security Grade</div>
                <div className="text-base font-bold text-white">Score {report.overallScore}/100</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Audited Endpoint</div>
              <div className="text-xs font-mono text-slate-200 truncate mt-1">{report.targetUrl}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Method: {report.method}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Weaknesses Identified</div>
              <div className="text-base font-bold mt-1">
                {report.findings.length > 0 ? (
                  <span className="text-rose-400">{report.findings.length} Issues</span>
                ) : (
                  <span className="text-emerald-400">0 Vulnerabilities Found</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Duration: {report.durationMs}ms</div>
            </div>
          </div>

          {/* Findings Summary */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3">Identified Weaknesses & Remediations</h4>
            {report.findings.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-emerald-300 text-sm">No Common Weaknesses Detected</p>
                <p className="text-slate-400 text-xs mt-1">
                  The AST pattern scanner verified parameterized query bindings and proper sanitization.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.findings.map(f => (
                  <div key={f.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{f.title}</span>
                      <span className="font-mono text-cyan-400 text-[10px]">{f.cwe}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
                      {f.aiExplanation}
                    </p>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                      {f.remediation.secureSnippet}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Defense Headers */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Recommended HTTP Security Headers</span>
            </h4>
            <div className="space-y-2">
              {report.recommendedHeaders.map((hdr, i) => (
                <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-white">{hdr.name}</span>
                    <p className="text-slate-400 text-[10px]">{hdr.reason}</p>
                  </div>
                  <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-800 shrink-0">
                    {hdr.recommendedValue}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Export for documentation or DevSecOps audit tracking.
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-950"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
