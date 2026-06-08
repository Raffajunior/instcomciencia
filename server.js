const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT || 8000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const LEGACY_ROUTES = {
  "/index.php": "index.html",
  "/index.php/": "index.html",
  "/index.php/depoimentos-home": "depoimentos-home/index.html",
  "/index.php/sobre": "sobre/index.html",
  "/index.php/cursos-de-formacao/workshop": "cursos-de-formacao/workshop/index.html",
  "/index.php/cursos-de-formacao/workshop-2": "cursos-de-formacao/workshop-2/index.html",
  "/index.php/cursos-de-formacao/consciencia-sistemica": "cursos-de-formacao/consciencia-sistemica/index.html",
  "/index.php/cursos-de-formacao/constelacao-familiar": "cursos-de-formacao/constelacao-familiar/index.html",
  "/index.php/cursos-de-formacao/educacao-sistemica": "cursos-de-formacao/educacao-sistemica/index.html",
  "/index.php/servicos": "servicos/index.html",
  "/index.php/profissionais": "profissionais/index.html",
  "/index.php/contato": "contato/index.html",
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (
    pathname === "/index.php" &&
    url.searchParams.get("option") === "com_rsform" &&
    url.searchParams.get("formId") === "7"
  ) {
    return path.join(__dirname, "inscricao-workshop", "index.html");
  }

  if (LEGACY_ROUTES[pathname]) {
    return path.join(__dirname, LEGACY_ROUTES[pathname]);
  }

  if (pathname === "/") return path.join(__dirname, "index.html");

  let filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequestPath(req.url);
  const relativePath = path.relative(__dirname, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Instituto ComCiência local: http://localhost:${PORT}`);
});
