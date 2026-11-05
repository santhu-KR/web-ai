import { ScanTarget } from '../types/security';

export const SAMPLE_TARGETS: ScanTarget[] = [
  {
    id: 'ecommerce-search',
    name: 'E-Commerce Search & Filter API (High Risk)',
    targetUrl: 'https://api.shopnexus.internal/v1/catalog/search?q=laptop&category=electronics&sortBy=price',
    method: 'GET',
    description: 'Endpoint accepts unescaped query strings and directly concatenates parameters into an SQL database query while reflecting inputs into HTML response headers.',
    parameters: [
      { name: 'q', type: 'query', exampleValue: 'laptop' },
      { name: 'category', type: 'query', exampleValue: 'electronics' },
      { name: 'sortBy', type: 'query', exampleValue: 'price' }
    ],
    endpointCodeSnippet: `// Express.js Route Handler - /catalog/search
app.get('/v1/catalog/search', async (req, res) => {
  const searchTerm = req.query.q;
  const sortBy = req.query.sortBy || 'id';

  // Insecure string concatenation directly into SQL query
  const query = "SELECT id, name, price, stock FROM products WHERE name LIKE '%" + searchTerm + "%' ORDER BY " + sortBy;
  const results = await db.query(query);

  // Directly reflecting raw user input back into rendered HTML template
  const htmlOutput = \`<div>Showing results for: <b>\${searchTerm}</b></div>\`;
  
  res.send(htmlOutput + JSON.stringify(results));
});`
  },
  {
    id: 'user-profile-renderer',
    name: 'User Profile & Bio Dashboard (XSS & Header Risk)',
    targetUrl: 'https://app.cloudpulse.io/api/users/profile?username=dev_alex&renderMode=preview',
    method: 'GET',
    description: 'Renders user profile biographies using un-sanitized client-side innerHTML injection without Content-Security-Policy or anti-framing headers.',
    parameters: [
      { name: 'username', type: 'query', exampleValue: 'dev_alex' },
      { name: 'renderMode', type: 'query', exampleValue: 'preview' }
    ],
    endpointCodeSnippet: `// Profile Preview Component & Backend Handler
app.get('/api/users/profile', async (req, res) => {
  const { username } = req.query;
  const user = await db.findUser({ username });

  // Missing security headers: No CSP, no X-Frame-Options, no HSTS
  res.setHeader('Content-Type', 'text/html');

  // Danger: Directly returning unsanitized markdown/HTML bio from database
  return res.send(\`
    <div id="profile-card">
      <h2>Profile: \${user.displayName}</h2>
      <div id="bio-container">\${user.bioHtml}</div>
      <script>
        // Client DOM sink: writing directly to innerHTML
        const customUrl = new URLSearchParams(window.location.search).get('theme');
        if (customUrl) document.getElementById('profile-card').innerHTML += customUrl;
      </script>
    </div>
  \`);
});`
  },
  {
    id: 'webhook-proxy',
    name: 'Webhook Event Dispatcher (SSRF Vulnerability)',
    targetUrl: 'https://gateway.finflow.co/v2/webhooks/dispatch?callbackUrl=https://hooks.client.com/events',
    method: 'POST',
    description: 'Endpoint fetches external callback URLs provided in client requests without validating internal IP ranges (RFC 1918) or DNS rebinding defenses.',
    parameters: [
      { name: 'callbackUrl', type: 'query', exampleValue: 'https://hooks.client.com/events' },
      { name: 'eventPayload', type: 'body', exampleValue: '{"event":"payment.completed"}' }
    ],
    endpointCodeSnippet: `// Webhook Dispatch Service
app.post('/v2/webhooks/dispatch', async (req, res) => {
  const targetUrl = req.query.callbackUrl;
  const { eventPayload } = req.body;

  // Danger: Unchecked HTTP fetch allows attacker to target cloud metadata (169.254.169.254)
  // or internal loopback services (127.0.0.1:8080)
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(eventPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json({ status: 'dispatched', code: response.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});`
  },
  {
    id: 'hardened-microservice',
    name: 'Hardened Authentication Service (OWASP Compliant)',
    targetUrl: 'https://auth.securecore.dev/api/v1/tokens/verify?client_id=sec_9841',
    method: 'POST',
    description: 'Hardened production endpoint with strict parameterized queries, strict schema validation, context encoding, and defense-in-depth HTTP security headers.',
    parameters: [
      { name: 'client_id', type: 'query', exampleValue: 'sec_9841' },
      { name: 'token', type: 'body', exampleValue: 'eyJhbGciOiJIUzI1Ni...' }
    ],
    endpointCodeSnippet: `// Hardened Microservice Pattern
import { z } from 'zod';
import helmet from 'helmet';

// 1. Strict Request Schema Validation
const RequestSchema = z.object({
  client_id: z.string().regex(/^[a-zA-Z0-9_-]{8,32}$/),
  token: z.string().jwt()
});

app.post('/api/v1/tokens/verify', helmet(), async (req, res) => {
  const parseResult = RequestSchema.safeParse({ client_id: req.query.client_id, token: req.body.token });
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  // 2. Safe Parameterized SQL Query (Prevents SQL Injection)
  const client = await db.query(
    'SELECT id, public_key, rate_limit FROM api_clients WHERE client_id = $1 AND is_active = $2',
    [parseResult.data.client_id, true]
  );

  return res.json({ valid: true, expiresAt: Date.now() + 3600000 });
});`
  }
];
