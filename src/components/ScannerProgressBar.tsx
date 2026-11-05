import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Cpu, 
  FileSearch, 
  ShieldAlert, 
  ShieldCheck, 
  Pause, 
  Play, 
  XSquare, 
  Activity,
  Zap
} from 'lucide-react';
import { SCAN_STAGES } from '../services/analyzer';

interface ScannerProgressBarProps {
  progressPercent: number;
  stageIndex: number;
  stageName: string;
  microTask: string;
  tokensAnalyzed: number;
  rulesEvaluated: number;
  threatsDetected: number;
  elapsedMs: number;
  isPaused: boolean;
  isScanning: boolean;
  onPauseToggle: () => void;
  onCancel: () => void;
}

export const ScannerProgressBar: React.FC<ScannerProgressBarProps> = ({
  progressPercent,
  stageIndex,
  stageName,
  microTask,
  tokensAnalyzed,
  rulesEvaluated,
  threatsDetected,
  elapsedMs,
  isPaused,
  isScanning,
  onPauseToggle,
  onCancel,
}) => {
  // Format elapsed time as mm:ss
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Estimate remaining time based on current rate
  const estRemainingMs = progressPercent > 0 && progressPercent < 100
    ? Math.max(0, Math.round((elapsedMs / progressPercent) * (100 - progressPercent)))
    : 0;
  const estRemainingSeconds = Math.ceil(estRemainingMs / 1000);

  // Dynamic progress track color based on threat status
  const trackGradient = threatsDetected > 0 
    ? 'from-cyan-500 via-amber-400 to-rose-500' 
    : 'from-cyan-500 via-sky-400 to-emerald-400';

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" 
        style={{ transform: `scaleX(${Math.max(0.1, progressPercent / 100)})`, transition: 'transform 300ms ease-out' }}
      />

      {/* Top Header: Current status, percentage & controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg border ${
            isScanning 
              ? isPaused 
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300' 
                : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-400' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}>
            <Activity className="w-5 h-5 animate-none" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                AI Analysis Engine
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                isScanning 
                  ? isPaused 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : progressPercent >= 100
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-700/50 text-slate-400'
              }`}>
                {isScanning ? (isPaused ? 'Paused' : 'Scanning Active') : (progressPercent >= 100 ? 'Audit Complete' : 'Standby')}
              </span>
            </div>
            <h3 className="text-base font-medium text-white truncate max-w-md">
              {stageName || 'Awaiting target initialization...'}
            </h3>
          </div>
        </div>

        {/* Right side controls & Percentage */}
        <div className="flex items-center space-x-4">
          {/* Pause / Cancel Buttons during scan */}
          {isScanning && (
            <div className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              <button
                onClick={onPauseToggle}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title={isPaused ? "Resume Analysis" : "Pause Analysis"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                title="Cancel Scan"
              >
                <XSquare className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Large percentage display */}
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {Math.min(100, Math.round(progressPercent))}
            </span>
            <span className="text-sm font-semibold text-cyan-400 font-mono">%</span>
          </div>
        </div>
      </div>

      {/* Flagship Visual Progress Bar Track */}
      <div className="relative my-3">
        {/* Track Container */}
        <div className="w-full h-4 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-slate-800/80 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${trackGradient} relative transition-all duration-300 ease-out`}
            style={{ width: `${Math.max(2, Math.min(100, progressPercent))}%` }}
          >
            {/* Shimmer light bar moving across the fill */}
            {isScanning && !isPaused && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
            
            {/* Glow tip at leading edge */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_12px_#38bdf8]" />
          </div>
        </div>

        {/* Stage Checkpoint Indicators overlayed along the track */}
        <div className="relative w-full flex justify-between mt-2.5 px-1">
          {SCAN_STAGES.map((stage, idx) => {
            const isCompleted = progressPercent >= 100 || idx < stageIndex;
            const isCurrent = idx === stageIndex && isScanning;
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col items-center group relative cursor-pointer"
                style={{ width: `${100 / SCAN_STAGES.length}%` }}
              >
                {/* Node icon */}
                <div className="flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 transition-colors" />
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-950 animate-spin" />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300" />
                    </div>
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-700" />
                  )}
                </div>

                {/* Stage title label */}
                <span className={`text-[11px] mt-1 font-medium text-center truncate max-w-[90%] transition-colors ${
                  isCompleted 
                    ? 'text-slate-300' 
                    : isCurrent 
                      ? 'text-cyan-300 font-semibold' 
                      : 'text-slate-600'
                }`}>
                  {stage.name.split(' ')[0]}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 shadow-xl whitespace-nowrap">
                    <p className="font-semibold text-white">{stage.name}</p>
                    <p className="text-slate-400 text-[10px]">{stage.description}</p>
                  </div>
                  <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700 transform rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Micro-Task Terminal Ticker */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg px-3 py-2 mt-3 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 truncate">
          <span className="text-cyan-400 font-bold">{'>'}</span>
          <span className="text-slate-300 truncate">
            {microTask || 'Scanner standby. Select target and click "Execute Security Audit".'}
          </span>
        </div>
        {isScanning && !isPaused && (
          <span className="inline-block w-2 h-3.5 bg-cyan-400 ml-2 animate-pulse shrink-0" />
        )}
      </div>

      {/* Bottom Live Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        {/* Metric 1: Elapsed Time & ETA */}
        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Duration</div>
            <div className="font-mono text-slate-200">
              {timeFormatted} {isScanning && estRemainingSeconds > 0 && (
                <span className="text-slate-500 text-[11px]"> (~{estRemainingSeconds}s left)</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: AST Tokens Analyzed */}
        <div className="flex items-center space-x-2 text-slate-400">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">AST Tokens</div>
            <div className="font-mono text-slate-200 font-semibold">{tokensAnalyzed.toLocaleString()}</div>
          </div>
        </div>

        {/* Metric 3: Rules Evaluated */}
        <div className="flex items-center space-x-2 text-slate-400">
          <FileSearch className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">OWASP Rules</div>
            <div className="font-mono text-slate-200 font-semibold">{rulesEvaluated} checked</div>
          </div>
        </div>

        {/* Metric 4: Threats Detected */}
        <div className="flex items-center space-x-2 text-slate-400">
          {threatsDetected > 0 ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Findings</div>
            <div className="font-mono font-bold">
              {threatsDetected > 0 ? (
                <span className="text-rose-400">{threatsDetected} Weakness{threatsDetected > 1 ? 'es' : ''}</span>
              ) : (
                <span className="text-emerald-400">0 Threats</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
