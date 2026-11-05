import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Sliders, 
  Eye, 
  FileCheck, 
  Volume2, 
  VolumeX, 
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface ControlDockProps {
  isScanning: boolean;
  scanProgress: number;
  threatCount: number;
  activeTab: 'scanner' | 'findings' | 'config';
  onTabChange: (tab: 'scanner' | 'findings' | 'config') => void;
  onOpenReport?: () => void;
  hasReport: boolean;
  speed: '1x' | '2x';
  onSpeedToggle: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isScanning,
  scanProgress,
  threatCount,
  activeTab,
  onTabChange,
  onOpenReport,
  hasReport,
  speed,
  onSpeedToggle,
  soundEnabled,
  onSoundToggle,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[min(940px,94vw)] transition-all duration-300">
      {/* Collapse/Expand Drawer Tab Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={onToggleCollapse}
          className="bg-slate-900 border-t border-x border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-1.5 rounded-t-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg select-none transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>▴ Show Scanner Controls & Telemetry</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>▾ Zen Mode (Inspect 3D Cyber Core)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
          {/* Navigation View Switchers */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('scanner')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Scanner & Progress</span>
            </button>

            <button
              onClick={() => onTabChange('findings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'findings'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Findings</span>
              {threatCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                  {threatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('config')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'config'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Target & Code</span>
            </button>
          </div>

          {/* Center Quick Telemetry Pill */}
          <div className="hidden md:flex items-center space-x-3 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Progress: {Math.round(scanProgress)}%</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <span>Core Mode:</span>
              <span className="text-white font-semibold">
                {threatCount > 0 ? 'ALERT' : isScanning ? 'ACTIVE AUDIT' : 'SECURE STANDBY'}
              </span>
            </div>
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center space-x-2">
            {/* Speed Toggle */}
            <button
              onClick={onSpeedToggle}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-colors"
              title="Toggle Analysis Execution Speed"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{speed} Speed</span>
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={onSoundToggle}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              title={soundEnabled ? "Mute Procedural Audio" : "Enable Procedural Audio"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* View Full Report Button */}
            {hasReport && (
              <button
                onClick={onOpenReport}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Audit Report</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
