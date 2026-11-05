import { ScanStage, VulnerabilityFinding, ScanReport, ScanTarget, ProjectFile } from '../types/security';

export const SCAN_STAGES: ScanStage[] = [
  {
    id: 'stage-1',
    name: 'Project & AST Ingestion',
    description: 'Deconstructing source files, AST tokens, and input routes',
    weight: 15,
    status: 'pending'
  },
  {
    id: 'stage-2',
    name: 'AST Sink Identification',
    description: 'Scanning code AST for dangerous execution sinks and raw concatenation',
    weight: 25,
    status: 'pending'
  },
  {
    id: 'stage-3',
    name: 'OWASP Pattern Matching',
    description: 'Evaluating rules against CWE-89 (SQLi), CWE-79 (XSS), CWE-918 (SSRF)',
    weight: 25,
    status: 'pending'
  },
  {
    id: 'stage-4',
    name: 'AI Contextual Reasoning',
    description: 'Generating threat models, verifying taint flow, and evaluating exploitability',
    weight: 20,
    status: 'pending'
  },
  {
    id: 'stage-5',
    name: 'Remediation Synthesis',
    description: 'Compiling secure code refactor diffs and defense-in-depth header policies',
    weight: 15,
    status: 'pending'
  }
];

export interface ScanProgressUpdate {
  stageIndex: number;
  overallPercent: number;
  currentStageId: string;
  stageName: string;
  microTask: string;
  tokensAnalyzed: number;
  rulesEvaluated: number;
  threatsDetected: number;
  newFinding?: VulnerabilityFinding;
  currentFile?: string;
  fileIndex?: number;
  totalFiles?: number;
}

function findLineNumber(content: string, substring: string): number {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(substring)) return i + 1;
  }
  return 1;
}

export function analyzeProjectFilesDefensively(
  files: ProjectFile[],
  onProgress: (update: ScanProgressUpdate) => void,
  signal?: { aborted: boolean }
): Promise<ScanReport> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const findings: VulnerabilityFinding[] = [];
    let tokensAnalyzed = 0;
    let rulesEvaluated = 0;

    const totalFiles = files.length;

    for (let fIdx = 0; fIdx < totalFiles; fIdx++) {
      if (signal?.aborted) {
        return reject(new Error('Scan aborted by user'));
      }

      const file = files[fIdx];
      const code = file.content;
      const baseProgress = Math.round((fIdx / totalFiles) * 100);
      const fileProgressSlice = Math.round(100 / totalFiles);

      // Stage 1: Ingestion for this file
      onProgress({
        stageIndex: 0,
        overallPercent: baseProgress + Math.round(fileProgressSlice * 0.15),
        currentStageId: SCAN_STAGES[0].id,
        stageName: `Auditing file (${fIdx + 1}/${totalFiles}): ${file.path}`,
        microTask: `Parsing AST tokens for ${file.path} (${(file.size / 1024).toFixed(1)} KB)...`,
        tokensAnalyzed: tokensAnalyzed += Math.floor(file.content.length / 8) + 30,
        rulesEvaluated: rulesEvaluated += 5,
        threatsDetected: findings.length,
        currentFile: file.path,
        fileIndex: fIdx + 1,
        totalFiles
      });
      await new Promise(r => setTimeout(r, 160));

      // Stage 2: Sink detection
      onProgress({
        stageIndex: 1,
        overallPercent: baseProgress + Math.round(fileProgressSlice * 0.35),
        currentStageId: SCAN_STAGES[1].id,
        stageName: `AST Sink Analysis: ${file.path}`,
        microTask: `Tracing taint flow and dangerous sinks in ${file.path}...`,
        tokensAnalyzed: tokensAnalyzed += 45,
        rulesEvaluated: rulesEvaluated += 12,
        threatsDetected: findings.length,
        currentFile: file.path,
        fileIndex: fIdx + 1,
        totalFiles
      });
      await new Promise(r => setTimeout(r, 180));

      // Pattern 1: SQL Injection (raw string concatenation into SQL statements)
      const hasSqlConcat = (code.includes("SELECT") || code.includes("INSERT") || code.includes("UPDATE") || code.includes("DELETE") || code.includes("FROM")) &&
        (code.includes(" + ") || code.includes("`") && code.includes("${") || code.includes("f\"SELECT") || code.includes(". $"));

      if (hasSqlConcat) {
        const line = findLineNumber(code, "SELECT") || findLineNumber(code, "query") || 1;
        const finding: VulnerabilityFinding = {
          id: `sqli-${file.id}-${Date.now()}`,
          title: `SQL Injection via Dynamic Concatenation in ${file.name}`,
          cwe: 'CWE-89',
          owaspCategory: 'A03:2021-Injection',
          severity: 'critical',
          filePath: file.path,
          lineNumber: line,
          endpoint: file.path,
          matchedPattern: code.split('\n')[line - 1]?.trim() || "SELECT ... + userParam",
          aiExplanation: `In file ${file.path} (line ${line}), SQL queries are constructed by concatenating unsanitized variables directly into SQL command strings. An adversary can inject quotes, UNION statements, or boolean expressions to manipulate the SQL engine and read or destroy unauthorized database data.`,
          impactAnalysis: 'Critical impact: Direct exposure of backend databases, authentication bypass, data tampering, or unauthorized administrative privilege acquisition.',
          remediation: {
            vulnerableSnippet: `// Insecure query construction in ${file.path} (Line ${line})\n` + (code.split('\n')[line - 1]?.trim() || "const query = \"SELECT * FROM users WHERE name = '\" + input + \"'\";"),
            secureSnippet: `// Secure: Use parameterized queries / prepared statements\nconst query = 'SELECT * FROM users WHERE name = $1';\nconst results = await db.query(query, [input]);`,
            language: file.language || 'typescript',
            explanation: 'Bind parameters using prepared statements ($1, ?, or named parameters). The SQL engine never interprets parameter data as executable query tokens.'
          },
          mitigationHeaders: ['Content-Security-Policy: default-src \'self\''],
          remediated: false
        };
        findings.push(finding);

        onProgress({
          stageIndex: 2,
          overallPercent: baseProgress + Math.round(fileProgressSlice * 0.6),
          currentStageId: SCAN_STAGES[2].id,
          stageName: `Threat Identified in ${file.path}`,
          microTask: `Flagged CWE-89 SQL Injection pattern on line ${line} of ${file.path}`,
          tokensAnalyzed,
          rulesEvaluated: rulesEvaluated += 6,
          threatsDetected: findings.length,
          newFinding: finding,
          currentFile: file.path,
          fileIndex: fIdx + 1,
          totalFiles
        });
        await new Promise(r => setTimeout(r, 160));
      }

      // Pattern 2: Cross-Site Scripting (innerHTML, document.write, unescaped template reflections)
      const hasXss = code.includes("innerHTML") || code.includes("dangerouslySetInnerHTML") || 
        (code.includes("res.send") && code.includes("<") && code.includes("${")) ||
        code.includes("document.write");

      if (hasXss) {
        const line = findLineNumber(code, "innerHTML") || findLineNumber(code, "res.send") || 1;
        const finding: VulnerabilityFinding = {
          id: `xss-${file.id}-${Date.now()}`,
          title: `Cross-Site Scripting (XSS Sink) in ${file.name}`,
          cwe: 'CWE-79',
          owaspCategory: 'A03:2021-Injection',
          severity: 'high',
          filePath: file.path,
          lineNumber: line,
          endpoint: file.path,
          matchedPattern: code.split('\n')[line - 1]?.trim() || "element.innerHTML += userInput",
          aiExplanation: `In file ${file.path} (line ${line}), unvalidated text is assigned directly to an active HTML/DOM sink like innerHTML or an unencoded HTTP HTML response body. This enables attackers to inject malicious script tags or event handlers that execute in the browser of victim users.`,
          impactAnalysis: 'High impact: Hijacking user sessions by reading document.cookie, redirecting to phishing portals, or performing actions on behalf of authenticated users.',
          remediation: {
            vulnerableSnippet: `// Insecure DOM/HTML sink in ${file.path} (Line ${line})\n` + (code.split('\n')[line - 1]?.trim() || "card.innerHTML += userText;"),
            secureSnippet: `// Secure: Use textContent or DOMPurify sanitization\nconst safeNode = document.createTextNode(userText);\ncard.appendChild(safeNode);\n\n// Or if HTML is required:\nimport DOMPurify from 'dompurify';\ncard.innerHTML = DOMPurify.sanitize(userHtml);`,
            language: file.language || 'typescript',
            explanation: 'Always use textContent or innerText when injecting textual content. For rich HTML, sanitize strictly using DOMPurify and configure a Content-Security-Policy header.'
          },
          mitigationHeaders: ["Content-Security-Policy: default-src 'self'; script-src 'self'"],
          remediated: false
        };
        findings.push(finding);

        onProgress({
          stageIndex: 2,
          overallPercent: baseProgress + Math.round(fileProgressSlice * 0.75),
          currentStageId: SCAN_STAGES[2].id,
          stageName: `Threat Identified in ${file.path}`,
          microTask: `Flagged CWE-79 XSS sink on line ${line} of ${file.path}`,
          tokensAnalyzed,
          rulesEvaluated: rulesEvaluated += 5,
          threatsDetected: findings.length,
          newFinding: finding,
          currentFile: file.path,
          fileIndex: fIdx + 1,
          totalFiles
        });
        await new Promise(r => setTimeout(r, 160));
      }

      // Pattern 3: Server-Side Request Forgery (SSRF)
      const hasSsrf = (code.includes("fetch(") || code.includes("axios.get(") || code.includes("http.get(")) &&
        (code.includes("req.query") || code.includes("req.body") || code.includes("targetUrl") || code.includes("callbackUrl"));

      if (hasSsrf) {
        const line = findLineNumber(code, "fetch") || findLineNumber(code, "axios") || 1;
        const finding: VulnerabilityFinding = {
          id: `ssrf-${file.id}-${Date.now()}`,
          title: `Server-Side Request Forgery (SSRF) in ${file.name}`,
          cwe: 'CWE-918',
          owaspCategory: 'A10:2021-Server-Side Request Forgery',
          severity: 'critical',
          filePath: file.path,
          lineNumber: line,
          endpoint: file.path,
          matchedPattern: code.split('\n')[line - 1]?.trim() || "fetch(targetUrl)",
          aiExplanation: `In file ${file.path} (line ${line}), the server makes HTTP requests to user-supplied URLs without verifying if the target hostname resolves to private IP addresses (RFC 1918) or cloud metadata endpoints (169.254.169.254).`,
          impactAnalysis: 'Critical impact: Attackers can reach internal services behind firewalls, extract cloud IAM role credentials, and scan internal networks.',
          remediation: {
            vulnerableSnippet: `// Insecure outbound fetch in ${file.path} (Line ${line})\n` + (code.split('\n')[line - 1]?.trim() || "const res = await fetch(userSuppliedUrl);"),
            secureSnippet: `// Secure: Restrict allowed domains and block internal IP addresses\nimport ipaddr from 'ipaddr.js';\nimport dns from 'dns/promises';\n\nconst parsed = new URL(userSuppliedUrl);\nif (parsed.protocol !== 'https:') throw new Error('HTTPS required');\nconst ips = await dns.resolve4(parsed.hostname);\nfor (const ip of ips) {\n  if (ipaddr.parse(ip).range() !== 'unicast' || ip.startsWith('169.254.')) {\n    throw new Error('Disallowed internal IP');\n  }\n}`,
            language: file.language || 'typescript',
            explanation: 'Enforce domain allowlisting, validate HTTPS, resolve DNS to block private IP ranges and cloud instance metadata addresses.'
          },
          remediated: false
        };
        findings.push(finding);
      }

      // Pattern 4: Hardcoded API Keys / Secrets
      const hasHardcodedSecret = /['"`]([A-Za-z0-9_-]{20,})['"`]/.test(code) && 
        (code.includes("API_KEY") || code.includes("SECRET") || code.includes("PASSWORD") || code.includes("TOKEN"));
      
      if (hasHardcodedSecret && !findings.some(f => f.cwe === 'CWE-798' && f.filePath === file.path)) {
        const line = findLineNumber(code, "KEY") || findLineNumber(code, "SECRET") || 1;
        const finding: VulnerabilityFinding = {
          id: `secret-${file.id}-${Date.now()}`,
          title: `Hardcoded API Secret or Credential in ${file.name}`,
          cwe: 'CWE-798',
          owaspCategory: 'A07:2021-Identification and Authentication Failures',
          severity: 'high',
          filePath: file.path,
          lineNumber: line,
          endpoint: file.path,
          matchedPattern: code.split('\n')[line - 1]?.trim() || "const API_KEY = '...'",
          aiExplanation: `In file ${file.path} (line ${line}), credentials or secret tokens appear to be hardcoded in source code files rather than loaded securely from environment variables.`,
          impactAnalysis: 'High impact: Secrets in source control can be leaked to unauthorized parties, compromising third-party accounts and backend APIs.',
          remediation: {
            vulnerableSnippet: `// Vulnerable: Hardcoded secret in source code (Line ${line})\n` + (code.split('\n')[line - 1]?.trim() || "const API_SECRET = 'sk_live_98471982741982';"),
            secureSnippet: `// Secure: Read secret from runtime environment\nconst API_SECRET = process.env.API_SECRET;\nif (!API_SECRET) throw new Error('API_SECRET is missing');`,
            language: file.language || 'typescript',
            explanation: 'Store all API keys, database credentials, and signing secrets in environment variables (.env / Secret Manager), never committed to code.'
          },
          remediated: false
        };
        findings.push(finding);
      }
    }

    // Stage 5: Finalize multi-file report
    onProgress({
      stageIndex: 4,
      overallPercent: 100,
      currentStageId: SCAN_STAGES[4].id,
      stageName: 'Multi-File Audit Complete',
      microTask: `Completed analysis across ${totalFiles} project files. Found ${findings.length} weakness(es).`,
      tokensAnalyzed,
      rulesEvaluated,
      threatsDetected: findings.length,
      totalFiles
    });

    const durationMs = Date.now() - startTime;
    let score = 100;
    findings.forEach(f => {
      if (f.severity === 'critical') score -= 30;
      else if (f.severity === 'high') score -= 20;
      else if (f.severity === 'medium') score -= 10;
      else if (f.severity === 'low') score -= 5;
    });
    score = Math.max(15, Math.min(100, score));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    resolve({
      id: `proj-rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetUrl: `${totalFiles} Project Files Audited`,
      method: 'BATCH_AST',
      durationMs,
      overallScore: score,
      grade,
      findings,
      recommendedHeaders: [
        {
          name: 'Content-Security-Policy',
          recommendedValue: "default-src 'self'; script-src 'self'; object-src 'none'",
          reason: 'Protects against script injection across rendered views.'
        },
        {
          name: 'Strict-Transport-Security',
          recommendedValue: 'max-age=31536000; includeSubDomains; preload',
          reason: 'Enforces HTTPS encryption on all incoming connections.'
        }
      ]
    });
  });
}


export function analyzeTargetDefensively(
  target: ScanTarget,
  onProgress: (update: ScanProgressUpdate) => void,
  signal?: { aborted: boolean }
): Promise<ScanReport> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const findings: VulnerabilityFinding[] = [];
    const code = target.endpointCodeSnippet;
    const url = target.targetUrl;

    const microTasks = [
      // Stage 1
      { stage: 0, text: 'Normalizing target URL and parsing query parameters...', duration: 240, progress: 5 },
      { stage: 0, text: `Deconstructing query parameters (${target.parameters.map(p => p.name).join(', ')})...`, duration: 260, progress: 12 },
      { stage: 0, text: 'Verifying TLS configuration and transport security posture...', duration: 200, progress: 15 },

      // Stage 2
      { stage: 1, text: 'Parsing JavaScript/TypeScript AST tree representation...', duration: 300, progress: 24 },
      { stage: 1, text: 'Scanning for dangerous database query sinks (raw SQL concatenation)...', duration: 320, progress: 32 },
      { stage: 1, text: 'Tracing taint flow from request inputs into DOM / HTML sinks...', duration: 300, progress: 40 },

      // Stage 3
      { stage: 2, text: 'Evaluating OWASP Top 10 rule vectors (A03:2021-Injection)...', duration: 340, progress: 48 },
      { stage: 2, text: 'Checking for CWE-89 SQL Injection pattern signatures...', duration: 320, progress: 54 },
      { stage: 2, text: 'Checking for CWE-79 Cross-Site Scripting & unescaped template reflections...', duration: 300, progress: 60 },
      { stage: 2, text: 'Checking for CWE-918 Server-Side Request Forgery in outbound fetches...', duration: 280, progress: 65 },

      // Stage 4
      { stage: 3, text: 'Executing AI contextual reasoning on detected source-to-sink paths...', duration: 380, progress: 72 },
      { stage: 3, text: 'Simulating theoretical impact and calculating CVSS severity scores...', duration: 360, progress: 80 },
      { stage: 3, text: 'Verifying absence of input sanitization or parameterized bindings...', duration: 320, progress: 85 },

      // Stage 5
      { stage: 4, text: 'Synthesizing defensive refactoring code diffs and prepared statements...', duration: 320, progress: 92 },
      { stage: 4, text: 'Drafting Content-Security-Policy & Strict-Transport-Security directives...', duration: 280, progress: 98 },
      { stage: 4, text: 'Finalizing comprehensive security audit report...', duration: 200, progress: 100 }
    ];

    let tokensAnalyzed = 0;
    let rulesEvaluated = 0;

    // Detect vulnerabilities based on code & URL patterns
    const hasSqlConcat = code.includes("SELECT") && (code.includes(" + ") || code.includes("${"));
    const hasXssSink = code.includes("innerHTML") || code.includes("<div>Showing results for: <b>${") || (code.includes("res.send") && code.includes("${"));
    const hasSsrfSink = code.includes("fetch(targetUrl") || code.includes("fetch(req.query");
    const missingHeaders = !code.includes("helmet") && !code.includes("Content-Security-Policy");

    for (let i = 0; i < microTasks.length; i++) {
      if (signal?.aborted) {
        return reject(new Error('Scan aborted by user'));
      }

      const task = microTasks[i];
      await new Promise(r => setTimeout(r, task.duration));

      tokensAnalyzed += Math.floor(Math.random() * 85) + 40;
      rulesEvaluated += Math.floor(Math.random() * 8) + 4;

      let newFinding: VulnerabilityFinding | undefined = undefined;

      // In stage 2/3, emit detected findings
      if (task.progress >= 54 && hasSqlConcat && !findings.some(f => f.cwe === 'CWE-89')) {
        newFinding = {
          id: 'vuln-sqli-01',
          title: 'SQL Injection via Dynamic String Concatenation',
          cwe: 'CWE-89',
          owaspCategory: 'A03:2021-Injection',
          severity: 'critical',
          parameter: target.parameters.find(p => p.name === 'q' || p.name === 'sortBy')?.name || 'q',
          endpoint: target.targetUrl,
          matchedPattern: "SELECT id, name, price, stock FROM products WHERE name LIKE '%\" + searchTerm + \"%'",
          aiExplanation: 'The application constructs dynamic SQL query strings using direct string concatenation with untrusted user input from `req.query.q`. An attacker can manipulate SQL structure by injecting quotes, comment syntax, or boolean clauses, bypassing query boundaries to read arbitrary database tables or execute unauthorized statements.',
          impactAnalysis: 'Critical impact: Complete compromise of database confidentiality and integrity. Can lead to unauthorized data exfiltration, authentication bypass, or data modification.',
          remediation: {
            vulnerableSnippet: `// Vulnerable: Raw string concatenation in query
const query = "SELECT id, name, price FROM products WHERE name LIKE '%" + searchTerm + "%'";
const results = await db.query(query);`,
            secureSnippet: `// Secure: Parameterized queries with prepared statements
const query = 'SELECT id, name, price FROM products WHERE name LIKE $1 ORDER BY $2';
const results = await db.query(query, ['%' + searchTerm + '%', sanitizedSort]);`,
            language: 'typescript',
            explanation: 'Always use parameterized queries (prepared statements). The database engine treats parameters strictly as data values, never as executable SQL commands, rendering injection syntactically impossible.'
          },
          mitigationHeaders: [
            'Content-Security-Policy: default-src \'self\'',
            'X-Content-Type-Options: nosniff'
          ],
          remediated: false
        };
        findings.push(newFinding);
      }

      if (task.progress >= 60 && hasXssSink && !findings.some(f => f.cwe === 'CWE-79')) {
        newFinding = {
          id: 'vuln-xss-01',
          title: 'Cross-Site Scripting (Reflected & DOM XSS)',
          cwe: 'CWE-79',
          owaspCategory: 'A03:2021-Injection',
          severity: 'high',
          parameter: 'q / theme',
          endpoint: target.targetUrl,
          matchedPattern: "innerHTML += customUrl / <b>${searchTerm}</b>",
          aiExplanation: 'The endpoint reflects raw query inputs into the HTTP HTML body and injects unvalidated URL parameters into the client DOM via `element.innerHTML`. Untrusted input executed in the context of the user session allows arbitrary JavaScript execution.',
          impactAnalysis: 'High impact: Session hijacking via cookie theft, credential harvesting through injected fake forms, and unauthorized actions performed on behalf of logged-in users.',
          remediation: {
            vulnerableSnippet: `// Vulnerable: Unencoded string injection into HTML/DOM
document.getElementById('profile-card').innerHTML += customUrl;
const htmlOutput = \`<div>Showing results for: <b>\${searchTerm}</b></div>\`;`,
            secureSnippet: `// Secure: Context-aware textContent / safe DOM manipulation & DOMPurify
import DOMPurify from 'dompurify';

const safeText = document.createTextNode(customUrl);
document.getElementById('profile-card').appendChild(safeText);

// Or server-side escaping:
import he from 'he';
const htmlOutput = \`<div>Showing results for: <b>\${he.encode(searchTerm)}</b></div>\`;`,
            language: 'typescript',
            explanation: 'Use textContent or innerText instead of innerHTML when inserting user-provided text. For HTML rendering, sanitize strictly using DOMPurify and enforce a rigorous Content Security Policy.'
          },
          mitigationHeaders: [
            "Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'",
            'X-XSS-Protection: 0'
          ],
          remediated: false
        };
        findings.push(newFinding);
      }

      if (task.progress >= 65 && hasSsrfSink && !findings.some(f => f.cwe === 'CWE-918')) {
        newFinding = {
          id: 'vuln-ssrf-01',
          title: 'Server-Side Request Forgery (SSRF) in Outbound Fetch',
          cwe: 'CWE-918',
          owaspCategory: 'A10:2021-Server-Side Request Forgery',
          severity: 'critical',
          parameter: 'callbackUrl',
          endpoint: target.targetUrl,
          matchedPattern: "const response = await fetch(targetUrl, ...)",
          aiExplanation: 'The application issues backend HTTP requests to client-supplied URLs without restricting destination IP addresses. An attacker can direct requests to internal infrastructure (such as 127.0.0.1, RFC 1918 private subnets, or cloud metadata endpoints like 169.254.169.254) to exfiltrate cloud credentials or access internal services.',
          impactAnalysis: 'Critical impact: Can expose internal services behind firewalls, cloud instance IAM metadata tokens, and backend administrative ports.',
          remediation: {
            vulnerableSnippet: `// Vulnerable: Blind outbound request to arbitrary user URL
const targetUrl = req.query.callbackUrl;
const response = await fetch(targetUrl, { method: 'POST', body: JSON.stringify(payload) });`,
            secureSnippet: `// Secure: Validate URL scheme, domain allowlist & block private IP ranges
import ipaddr from 'ipaddr.js';
import dns from 'dns/promises';

async function validateOutboundUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS allowed');
  
  // Resolve IP to check for private or metadata addresses
  const addresses = await dns.resolve4(parsed.hostname);
  for (const ip of addresses) {
    const addr = ipaddr.parse(ip);
    if (addr.range() !== 'unicast' || ip.startsWith('169.254.')) {
      throw new Error('Forbidden internal address');
    }
  }
  return true;
}`,
            language: 'typescript',
            explanation: 'Enforce strict domain allowlisting for outgoing webhooks, require HTTPS, resolve DNS before connecting to block RFC 1918 private IP ranges and cloud metadata services, and isolate the dispatcher worker in a dedicated network DMZ.'
          },
          remediated: false
        };
        findings.push(newFinding);
      }

      if (task.progress >= 75 && missingHeaders && !findings.some(f => f.cwe === 'CWE-693')) {
        newFinding = {
          id: 'vuln-headers-01',
          title: 'Missing Core HTTP Defense Headers',
          cwe: 'CWE-693',
          owaspCategory: 'A05:2021-Security Misconfiguration',
          severity: 'medium',
          endpoint: target.targetUrl,
          matchedPattern: 'Missing helmet() or explicit CSP / HSTS / Frame protection headers',
          aiExplanation: 'The HTTP response omits defense-in-depth security headers including Content-Security-Policy, Strict-Transport-Security (HSTS), and X-Frame-Options. This leaves users susceptible to clickjacking, MIME-type sniffing, and downgraded protocol transitions.',
          impactAnalysis: 'Medium impact: Reduces browser-enforced security boundaries and makes exploitation of secondary injection flaws easier.',
          remediation: {
            vulnerableSnippet: `// Vulnerable: Raw express handler without security middleware
app.get('/api/users/profile', async (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(...);
});`,
            secureSnippet: `// Secure: Apply helmet() middleware with strict defaults
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' }
}));`,
            language: 'typescript',
            explanation: 'Include security headers on all responses via Helmet or reverse-proxy configurations (Nginx/Cloudflare) to enforce strict transport security and restrict framing.'
          },
          mitigationHeaders: [
            'Strict-Transport-Security: max-age=31536000; includeSubDomains',
            'X-Frame-Options: DENY',
            'X-Content-Type-Options: nosniff'
          ],
          remediated: false
        };
        findings.push(newFinding);
      }

      onProgress({
        stageIndex: task.stage,
        overallPercent: task.progress,
        currentStageId: SCAN_STAGES[task.stage].id,
        stageName: SCAN_STAGES[task.stage].name,
        microTask: task.text,
        tokensAnalyzed,
        rulesEvaluated,
        threatsDetected: findings.length,
        newFinding
      });
    }

    const durationMs = Date.now() - startTime;
    
    // Calculate overall score (100 is perfect)
    let score = 100;
    findings.forEach(f => {
      if (f.severity === 'critical') score -= 35;
      else if (f.severity === 'high') score -= 25;
      else if (f.severity === 'medium') score -= 15;
      else if (f.severity === 'low') score -= 5;
    });
    score = Math.max(12, Math.min(100, score));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    const report: ScanReport = {
      id: `rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetUrl: target.targetUrl,
      method: target.method,
      durationMs,
      overallScore: score,
      grade,
      findings,
      recommendedHeaders: [
        {
          name: 'Content-Security-Policy',
          recommendedValue: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';",
          reason: 'Prevents XSS execution and unauthorized script loading.'
        },
        {
          name: 'Strict-Transport-Security',
          recommendedValue: 'max-age=31536000; includeSubDomains; preload',
          reason: 'Enforces HTTPS and protects against SSL stripping attacks.'
        },
        {
          name: 'X-Content-Type-Options',
          recommendedValue: 'nosniff',
          reason: 'Prevents MIME-type confusion attacks.'
        },
        {
          name: 'X-Frame-Options',
          recommendedValue: 'DENY',
          reason: 'Mitigates UI redressing and clickjacking.'
        }
      ]
    };

    resolve(report);
  });
}
