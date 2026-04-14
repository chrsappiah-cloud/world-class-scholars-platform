const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const cluster = require('cluster');
const os = require('os');
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const routes = {
  '/': 'index.html',
  '/courses': 'courses.html',
  '/advocacy': 'advocacy.html',
  '/arts': 'arts.html',
  '/contact': 'contact.html'
};

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Page Not Found</h1>');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function createServerInstance() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    let filePath = path.join(PUBLIC_DIR, 'index.html');
    if (routes[pathname]) {
      filePath = path.join(PUBLIC_DIR, routes[pathname]);
    } else if (pathname.match(/\.(css|js|png|jpg|ico)$/)) {
      filePath = path.join(PUBLIC_DIR, pathname.slice(1));
    }
    serveStatic(filePath, res);
  });
}

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  const server = createServerInstance();
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Server running at http://localhost:' + PORT);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
