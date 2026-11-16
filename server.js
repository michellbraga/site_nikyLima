'use strict';

/**
 * Servidor estático do site Niky Lima Tattoo.
 * Sem dependências: usa apenas módulos nativos do Node.js.
 * Inicia com: npm start  (ou: node server.js)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CANONICAL_HOST = process.env.CANONICAL_HOST || ''; // ex.: nikylimatattoo.com (opcional, redireciona www)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);
const gzipCache = new Map();

function cacheControl(ext) {
  if (ext === '.html' || ext === '.xml' || ext === '.txt') return 'public, max-age=300';
  return 'public, max-age=2592000, immutable'; // 30 dias para imagens, vídeos e scripts
}

function baseHeaders(extra) {
  return Object.assign(
    {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
    extra
  );
}

function sendFile(req, res, filePath, status) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send404(req, res);

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const etag = '"' + stat.size.toString(16) + '-' + Math.floor(stat.mtimeMs).toString(16) + '"';
    const headers = baseHeaders({
      'Content-Type': type,
      'Cache-Control': status === 404 ? 'no-cache' : cacheControl(ext),
      'Last-Modified': stat.mtime.toUTCString(),
      'ETag': etag,
      'Accept-Ranges': 'bytes',
      'Vary': 'Accept-Encoding',
    });

    if (status !== 404 && req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }

    // Requisições parciais (necessárias para vídeo no Safari e iOS)
    const range = req.headers.range;
    if (range && status !== 404) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] === '' ? NaN : parseInt(m[1], 10);
        let end = m[2] === '' ? NaN : parseInt(m[2], 10);
        if (isNaN(start)) { start = Math.max(stat.size - end, 0); end = stat.size - 1; }
        else if (isNaN(end) || end >= stat.size) { end = stat.size - 1; }
        if (start > end || start >= stat.size) {
          res.writeHead(416, baseHeaders({ 'Content-Range': 'bytes */' + stat.size }));
          return res.end();
        }
        headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
        headers['Content-Length'] = end - start + 1;
        res.writeHead(206, headers);
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(filePath, { start, end }).pipe(res);
      }
    }

    const wantsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (wantsGzip && COMPRESSIBLE.has(ext)) {
      const key = filePath + ':' + etag;
      let buf = gzipCache.get(key);
      const reply = (gz) => {
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = gz.length;
        res.writeHead(status || 200, headers);
        res.end(req.method === 'HEAD' ? undefined : gz);
      };
      if (buf) return reply(buf);
      return fs.readFile(filePath, (e, data) => {
        if (e) return send404(req, res);
        zlib.gzip(data, { level: 9 }, (e2, gz) => {
          if (e2) return send404(req, res);
          gzipCache.set(key, gz);
          reply(gz);
        });
      });
    }

    headers['Content-Length'] = stat.size;
    res.writeHead(status || 200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

function send404(req, res) {
  const page = path.join(PUBLIC_DIR, '404.html');
  fs.readFile(page, (err, data) => {
    const body = err ? 'Página não encontrada' : data;
    res.writeHead(404, baseHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(body),
    }));
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, baseHeaders({ Allow: 'GET, HEAD' }));
    return res.end();
  }

  // Redireciona www para o domínio principal, se CANONICAL_HOST estiver definido
  const host = (req.headers.host || '').toLowerCase();
  if (CANONICAL_HOST && host === 'www.' + CANONICAL_HOST) {
    res.writeHead(301, { Location: 'https://' + CANONICAL_HOST + req.url });
    return res.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    res.writeHead(400, baseHeaders());
    return res.end();
  }

  if (pathname.indexOf('\0') !== -1) {
    res.writeHead(400, baseHeaders());
    return res.end();
  }

  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/index.html' && req.url !== '/' && !req.url.startsWith('/?') && !req.url.startsWith('/#')) {
    res.writeHead(301, { Location: '/' });
    return res.end();
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, baseHeaders());
    return res.end();
  }

  sendFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log('Niky Lima Tattoo rodando na porta ' + PORT);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
