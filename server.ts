import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  getKeys,
  createKey,
  toggleKeyStatus,
  deleteKey,
  getLogs,
  clearLogs,
  addLog,
  updateKeyUsage,
} from './src/lib/db.js';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // 1. API Management Endpoints for the Dashboard
  app.get('/api/keys', (req, res) => {
    try {
      res.json(getKeys());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/keys', (req, res) => {
    try {
      const { name, description, allowedModels } = req.body;
      const newKey = createKey(name, description, allowedModels || []);
      res.status(201).json(newKey);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/keys/:id/toggle', (req, res) => {
    try {
      const { id } = req.params;
      const updated = toggleKeyStatus(id);
      if (!updated) {
        return res.status(404).json({ error: 'Key not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/keys/:id', (req, res) => {
    try {
      const { id } = req.params;
      const success = deleteKey(id);
      if (!success) {
        return res.status(404).json({ error: 'Key not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/logs', (req, res) => {
    try {
      res.json(getLogs());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/logs', (req, res) => {
    try {
      clearLogs();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stats', (req, res) => {
    try {
      const keys = getKeys();
      const logs = getLogs();

      const totalRequests = logs.length;
      const activeKeys = keys.filter((k) => k.status === 'active').length;
      
      // Calculate model distribution
      const modelDistribution: Record<string, number> = {};
      logs.forEach((log) => {
        modelDistribution[log.model] = (modelDistribution[log.model] || 0) + 1;
      });

      // Calculate success rate
      const successfulRequests = logs.filter((l) => l.status >= 200 && l.status < 300).length;
      const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 100;

      // Calculate average latency
      const avgLatency = totalRequests > 0 
        ? Math.round(logs.reduce((acc, curr) => acc + curr.latency, 0) / totalRequests) 
        : 0;

      res.json({
        totalRequests,
        activeKeys,
        totalKeys: keys.length,
        successRate,
        avgLatency,
        modelDistribution,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Real Working Gemini API Proxy Endpoint
  app.post(['/api/v1beta/models/*', '/v1beta/models/*'], async (req, res) => {
    const match = req.path.match(/\/models\/(.+)$/);
    if (!match) {
      return res.status(400).json({
        error: {
          code: 400,
          message: "Invalid model path structure. Expected format: models/{model}:{method}",
          status: "INVALID_ARGUMENT"
        }
      });
    }

    const modelAndMethod = match[1]; // e.g. "gemini-3.5-flash:generateContent"
    const modelName = modelAndMethod.split(':')[0];
    const methodName = modelAndMethod.split(':')[1] || 'generateContent';

    // Extract the client's API Key
    let clientKey = (req.headers['x-goog-api-key'] || req.query.key || '') as string;
    if (!clientKey && req.headers['authorization']) {
      const authHeader = req.headers['authorization'] as string;
      if (authHeader.startsWith('Bearer ')) {
        clientKey = authHeader.substring(7);
      }
    }

    const keys = getKeys();
    let verifiedKey = keys.find((k) => k.id === clientKey);

    // List of models that can be accessed WITHOUT an API key
    const keylessAllowedModels = ['gemini-3.5-flash', 'gemini-2.5-flash'];

    if (!clientKey) {
      // Keyless access check
      const isKeylessAllowed = keylessAllowedModels.some(m => modelName.toLowerCase().includes(m.toLowerCase()));
      if (!isKeylessAllowed) {
        return res.status(401).json({
          error: {
            code: 401,
            message: `API key not valid. Please pass a valid custom API key, or use a keyless allowed model (${keylessAllowedModels.join(', ')}).`,
            status: "UNAUTHENTICATED"
          }
        });
      }
    } else {
      // Key validation
      if (!verifiedKey) {
        return res.status(403).json({
          error: {
            code: 403,
            message: "API key not found or invalid.",
            status: "PERMISSION_DENIED"
          }
        });
      }

      if (verifiedKey.status === 'inactive') {
        return res.status(403).json({
          error: {
            code: 403,
            message: "API key is inactive. Please activate it in the Gemini API Gateway dashboard.",
            status: "PERMISSION_DENIED"
          }
        });
      }

      // Check model permission
      const isModelAllowed = verifiedKey.allowedModels.some(
        (m) => m === '*' || modelName.toLowerCase().includes(m.toLowerCase())
      );

      if (!isModelAllowed) {
        return res.status(403).json({
          error: {
            code: 403,
            message: `Model '${modelName}' is not authorized for this API key. Allowed models: ${verifiedKey.allowedModels.join(', ')}`,
            status: "PERMISSION_DENIED"
          }
        });
      }
    }

    // Get the real developer API Key from server env
    const realApiKey = process.env.GEMINI_API_KEY || '';
    if (!realApiKey) {
      return res.status(500).json({
        error: {
          code: 500,
          message: "Gateway is not configured with a valid server-side GEMINI_API_KEY. Set it in the Secrets panel.",
          status: "INTERNAL"
        }
      });
    }

    // Reconstruct the real target URL with the query parameters (retaining all except custom client key)
    const queryParams = new URLSearchParams();
    for (const [key, val] of Object.entries(req.query)) {
      if (key !== 'key') {
        queryParams.append(key, val as string);
      }
    }
    queryParams.append('key', realApiKey);

    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelAndMethod}?${queryParams.toString()}`;

    const startTime = Date.now();
    try {
      // Forward request to the real Gemini API
      const headers: Record<string, string> = {
        'content-type': (req.headers['content-type'] as string) || 'application/json',
        'x-goog-api-key': realApiKey,
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });

      const latency = Date.now() - startTime;

      // Log request execution in database
      addLog({
        keyId: clientKey ? (verifiedKey?.id || 'invalid') : 'keyless',
        keyName: clientKey ? (verifiedKey?.name || 'Unknown Key') : 'Keyless Public Access',
        model: modelName,
        method: methodName,
        status: response.status,
        latency,
        error: response.ok ? null : `API Error Status ${response.status}`
      });

      if (clientKey && verifiedKey) {
        updateKeyUsage(clientKey);
      }

      // Set headers from the Google API back to the client
      res.status(response.status);
      response.headers.forEach((value, name) => {
        if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(name.toLowerCase())) {
          res.setHeader(name, value);
        }
      });

      // Stream support if needed
      const isStream = response.headers.get('content-type')?.includes('text/event-stream') || 
                       methodName.includes('stream') || 
                       req.query.alt === 'sse';

      if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (err: any) {
      const latency = Date.now() - startTime;
      console.error('Error during API Gateway routing:', err);

      addLog({
        keyId: clientKey ? (verifiedKey?.id || 'error') : 'keyless',
        keyName: clientKey ? (verifiedKey?.name || 'Error Key') : 'Keyless Public Access',
        model: modelName,
        method: methodName,
        status: 502,
        latency,
        error: err.message || 'Failed to route request to Google server.'
      });

      res.status(502).json({
        error: {
          code: 502,
          message: `Gateway Error: ${err.message || 'Failed to contact Google servers.'}`,
          status: "BAD_GATEWAY"
        }
      });
    }
  });

  // 3. Mount Vite Dev Server Middleware or static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini API Gateway Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
