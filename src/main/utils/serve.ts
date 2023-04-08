import http from 'http';
import fs from 'fs';
import path from 'path';

export function createServerForDir(directory: string, port: number) {
  const server = http.createServer((req, res) => {
    // Normalize request URL to remove query string and double slashes
    const reqUrl = path.normalize(req.url || '').replace(/^(\.\.[\/\\])+/, '');

    // Get the absolute path to the requested file
    const filePath = path.join(directory, reqUrl);

    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        // The requested file is a directory, so try to find index.html
        const indexFilePath = path.join(filePath, 'index.html');
        try {
          const indexStats = fs.statSync(indexFilePath);
          if (indexStats.isFile()) {
            // The index.html file exists, so return its contents
            const data = fs.readFileSync(indexFilePath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
            return;
          }
        } catch (err) {
          // index.html does not exist
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else if (stats.isFile()) {
        // The requested file is a regular file, so return its contents
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.end(data);
      } else {
        // The requested file does not exist
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    } catch (err) {
      // The requested file does not exist
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`[createServerForDir] Server running at http://127.0.0.1:${port}/`);
  });

  // Add handler for the 'exit' event to close the server
  process.on('exit', () => {
    console.log('[createServerForDir] Closing server...');
    server.close(() => {
      console.log('[createServerForDir] Server closed');
    });
  });

  return server;
}
