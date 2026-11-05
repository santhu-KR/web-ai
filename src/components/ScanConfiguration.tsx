import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Globe, 
  FileCode, 
  RotateCcw, 
  Sliders, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ScanTarget } from '../types/security';
import { SAMPLE_TARGETS } from '../data/sampleTargets';

interface ScanConfigurationProps {
  currentTarget: ScanTarget;
  onSelectTarget: (target: ScanTarget) => void;
  onUpdateTargetCode: (newCode: string) => void;
  onStartScan: () => void;
  isScanning: boolean;
}

export const ScanConfiguration: React.FC<ScanConfigurationProps> = ({
  currentTarget,
  onSelectTarget,
  onUpdateTargetCode,
  onStartScan,
  isScanning
}) => {
  const [showCodeEditor, setShowCodeEditor] = useState(true);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header and Preset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Endpoint & Code Configuration</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {currentTarget.name}
          </h2>
        </div>

        {/* Start Scan CTA */}
        <button
          onClick={onStartScan}
          disabled={isScanning}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-bold text-sm shadow-xl transition-all ${
            isScanning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50 hover:shadow-cyan-500/25 cursor-pointer scale-100 hover:scale-[1.02]'
          }`}
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Vectors...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Execute Security Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Target Presets Bar */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center space-x-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Quick Vulnerability Test Scenarios</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SAMPLE_TARGETS.map(target => (
            <button
              key={target.id}
              onClick={() => onSelectTarget(target)}
              disabled={isScanning}
              className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                currentTarget.id === target.id
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-white shadow-md'
                  : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">{target.name.split(' (')[0]}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {target.id.includes('search') ? 'SQLi & Reflected XSS' :
                 target.id.includes('user') ? 'DOM XSS & Headers' :
                 target.id.includes('webhook') ? 'Outbound SSRF' : 'Hardened API'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target URL Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 mb-3 flex items-center space-x-2 text-xs">
        <span className="px-2 py-1 bg-cyan-950 text-cyan-400 font-mono font-bold rounded border border-cyan-800 text-[10px]">
          {currentTarget.method}
        </span>
        <Globe className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="font-mono text-slate-200 truncate select-all flex-1">
          {currentTarget.targetUrl}
        </span>
      </div>

      {/* Target Parameters Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[11px] text-slate-400 mr-1">Surface Parameters:</span>
        {currentTarget.parameters.map((param, i) => (
          <span 
            key={i} 
            className="inline-flex items-center space-x-1 text-[11px] font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300"
          >
            <span className="text-cyan-400">{param.name}</span>
            <span className="text-slate-600">({param.type})</span>
          </span>
        ))}
      </div>

      {/* Code Snippet Viewer / Editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Endpoint Implementation AST Preview</span>
          </label>
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {showCodeEditor ? 'Collapse Code' : 'Expand Code'}
          </button>
        </div>

        {showCodeEditor && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <textarea
              value={currentTarget.endpointCodeSnippet}
              onChange={(e) => onUpdateTargetCode(e.target.value)}
              disabled={isScanning}
              rows={8}
              className="w-full bg-slate-950 font-mono text-[11px] p-3 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 leading-5 resize-y"
              placeholder="Paste custom route handler or AST snippet..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
