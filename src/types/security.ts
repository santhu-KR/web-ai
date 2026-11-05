export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type VulnerabilityCategory = 
  | 'SQL_INJECTION'
  | 'CROSS_SITE_SCRIPTING'
  | 'CSRF'
  | 'SSRF'
  | 'INSECURE_HEADERS'
  | 'BROKEN_ACCESS_CONTROL'
  | 'SENSITIVE_DATA_EXPOSURE';

export interface CodeRemediation {
  vulnerableSnippet: string;
  secureSnippet: string;
  language: string;
  explanation: string;
  bestPracticeDocsUrl?: string;
}

export interface VulnerabilityFinding {
  id: string;
  title: string;
  cwe: string;
  owaspCategory: string;
  severity: Severity;
  parameter?: string;
  endpoint: string;
  filePath?: string;
  lineNumber?: number;
  matchedPattern: string;
  aiExplanation: string;
  impactAnalysis: string;
  remediation: CodeRemediation;
  mitigationHeaders?: string[];
  remediated: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  language: string;
  uploadedAt: string;
  findingCount?: number;
}

export interface ScanStage {
  id: string;
  name: string;
  description: string;
  weight: number; // weight in percentage of total scan
  status: 'pending' | 'active' | 'completed' | 'warning';
}

export interface ScanMetrics {
  totalParameters: number;
  tokensAnalyzed: number;
  rulesEvaluated: number;
  threatsDetected: number;
  elapsedTimeMs: number;
  estimatedRemainingMs: number;
}

export interface ScanTarget {
  id: string;
  name: string;
  targetUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpointCodeSnippet: string;
  parameters: { name: string; type: 'query' | 'body' | 'header'; exampleValue: string }[];
  description: string;
}

export interface ScanReport {
  id: string;
  timestamp: string;
  targetUrl: string;
  method: string;
  durationMs: number;
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  findings: VulnerabilityFinding[];
  recommendedHeaders: { name: string; recommendedValue: string; reason: string }[];
}
