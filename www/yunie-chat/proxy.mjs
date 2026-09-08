#!/usr/bin/env node
/**
 * YUNIE Chat — local proxy (0 deps, Node 18+)
 * Vì sao cần: OpenCode Zen API không trả CORS headers (đo bằng curl 2026-09-08)
 * → browser gọi thẳng bị chặn. Proxy này serve trang chat + forward request.
 *
 * Chạy:  node www/yunie-chat/proxy.mjs
 * Mở:    http://localhost:8787
 *
 * Key vẫn do user nhập trong trang — proxy KHÔNG lưu key, chỉ forward header.
 */
import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const ENV_KEY = process.env.OPENCODE_API_KEY || ''; // đặt env này → không cần nhập key trong trang
const ZEN_HOST = 'opencode.ai';
/* Gói Go ($10/tháng) — base /zen/go/v1, docs /docs/go 2026-09-08 */
const ROUTES = {
  '/v1/chat/completions': '/zen/go/v1/chat/completions',
  '/v1/responses': '/zen/go/v1/responses'
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function serveStatic(res, urlPath) {
  const file = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const safe = file.includes('..') ? null : file;
  if (!safe) { res.writeHead(400); res.end('Bad path'); return; }
  readFile(join(__dirname, safe))
    .then((data) => {
      res.writeHead(200, { 'Content-Type': MIME[extname(safe)] || 'application/octet-stream' });
      res.end(data);
    })
    .catch(() => {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — không tìm thấy ' + safe);
    });
}

function forwardToZen(req, res) {
  const zenPath = ROUTES[req.url];
  if (!zenPath) { res.writeHead(404); res.end('Unknown endpoint'); return; }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const auth = req.headers.authorization || (ENV_KEY ? 'Bearer ' + ENV_KEY : '');
    const zreq = https.request({
      hostname: ZEN_HOST,
      path: zenPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Content-Length': body.length,
        'Accept': req.headers.accept || 'text/event-stream',
        'x-opencode-session': req.headers['x-opencode-session'] || '', // Go yêu cầu session header
        'User-Agent': 'yunie-chat/1.0' // Go: tự định danh, không dùng generic SDK UA
      }
    }, (zres) => {
      res.writeHead(zres.statusCode || 502, { 'Content-Type': zres.headers['content-type'] || 'application/json' });
      zres.pipe(res); // stream SSE nguyên vẹn
    });
    zreq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      }
      res.end(JSON.stringify({ error: { message: 'Proxy không gọi được Zen API: ' + err.message } }));
    });
    zreq.end(body);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && ROUTES[req.url]) {
    forwardToZen(req, res);
  } else if (req.method === 'GET') {
    serveStatic(res, req.url.split('?')[0]);
  } else {
    res.writeHead(405); res.end('Method not allowed');
  }
});

server.listen(PORT, () => {
  console.log('💜 YUNIE Chat proxy đang chạy: http://localhost:' + PORT);
  console.log(ENV_KEY
    ? '   Key: dùng env OPENCODE_API_KEY — mở trang là chat luôn, không cần nhập key!'
    : '   Tip: chạy "set OPENCODE_API_KEY=oc-..." trước (hoặc $env:OPENCODE_API_KEY trên PowerShell) để không cần nhập key trong trang.');
  console.log('   (Ctrl+C để tắt — key không lưu ở proxy, chỉ forward)');
});