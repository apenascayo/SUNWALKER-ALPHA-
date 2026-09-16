import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../public/", import.meta.url)));
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isInsideRoot(path) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function sendFile(response, path, contentType) {
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  createReadStream(path).pipe(response);
}

function contentTypeFor(path) {
  const extension = extname(path).toLowerCase();
  return mimeTypes[extension] || "application/octet-stream";
}

async function handleRequest(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad Request");
    return;
  }

  const requestedPath = resolve(normalize(join(root, pathname)));
  if (!isInsideRoot(requestedPath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let filePath = requestedPath;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    // Extensionless URLs use the static landing page as a fallback.
    if (!extname(pathname)) filePath = join(root, "index.html");
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile() || !isInsideRoot(resolve(filePath))) throw new Error("Not a file");
    if (request.method === "HEAD") {
      response.writeHead(200, {
        "Content-Type": contentTypeFor(filePath),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });
      response.end();
      return;
    }
    sendFile(response, filePath, contentTypeFor(filePath));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  }
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500);
    response.end("Internal Server Error");
  });
});

server.listen(port, () => {
  console.log(`Sunwalker running at http://localhost:${port}`);
});
