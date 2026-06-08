import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "http://instcomciencia.web2f02.uni5.net";
const alternateHost = "instcomciencia.com.br";

const pages = [
  ["/index.php", "index.html", "/"],
  ["/index.php/depoimentos-home", "depoimentos-home/index.html", "/depoimentos-home/"],
  ["/index.php/sobre", "sobre/index.html", "/sobre/"],
  ["/index.php/cursos-de-formacao/workshop", "cursos-de-formacao/workshop/index.html", "/cursos-de-formacao/workshop/"],
  ["/index.php/cursos-de-formacao/workshop-2", "cursos-de-formacao/workshop-2/index.html", "/cursos-de-formacao/workshop-2/"],
  ["/index.php/cursos-de-formacao/consciencia-sistemica", "cursos-de-formacao/consciencia-sistemica/index.html", "/cursos-de-formacao/consciencia-sistemica/"],
  ["/index.php/cursos-de-formacao/constelacao-familiar", "cursos-de-formacao/constelacao-familiar/index.html", "/cursos-de-formacao/constelacao-familiar/"],
  ["/index.php/cursos-de-formacao/educacao-sistemica", "cursos-de-formacao/educacao-sistemica/index.html", "/cursos-de-formacao/educacao-sistemica/"],
  ["/index.php/servicos", "servicos/index.html", "/servicos/"],
  ["/index.php/profissionais", "profissionais/index.html", "/profissionais/"],
  ["/index.php/contato", "contato/index.html", "/contato/"],
  ["/index.php?option=com_rsform&view=rsform&formId=7", "inscricao-workshop/index.html", "/inscricao-workshop/"],
];

const extraAssets = [
  "/components/com_layer_slider/base/static/layerslider/skins/v6/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/noskin/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/carousel/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/defaultskin/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/fullwidth/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/glass/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/lightskin/skin.css",
  "/components/com_layer_slider/base/static/layerslider/skins/minimal/skin.css",
];

const pageBySource = new Map();
const routeBySource = new Map();
const routeByPath = new Map();

for (const [source, output, route] of pages) {
  const url = new URL(source, origin);
  pageBySource.set(normalizePageKey(url), output);
  routeBySource.set(normalizePageKey(url), route);
  routeByPath.set(url.pathname, route);
}

const downloadedAssets = new Set();
const pendingAssets = [];
const rootDir = process.cwd();

function normalizePageKey(url) {
  const normalized = new URL(url.href);
  normalized.hash = "";
  if (normalized.pathname === "/") normalized.pathname = "/index.php";
  normalized.searchParams.sort();
  return `${normalized.pathname}${normalized.search}`;
}

function isLocalHost(url) {
  return url.hostname === new URL(origin).hostname || url.hostname === alternateHost;
}

function routeForUrl(url) {
  if (!isLocalHost(url)) return null;

  const key = normalizePageKey(url);
  if (routeBySource.has(key)) return routeBySource.get(key);

  if (url.pathname === "/" || url.pathname === "/index.php") return "/";
  if (
    url.pathname.startsWith("/component/rsform/form/7-no-title-copy-copy") ||
    url.pathname.startsWith("/index.php/component/rsform/form/7-no-title-copy-copy")
  ) {
    return "/inscricao-workshop/";
  }

  if (url.pathname.startsWith("/index.php/")) {
    const friendly = `/${url.pathname.slice("/index.php/".length).replace(/^\/+/, "")}/`;
    return friendly.replace(/\/{2,}/g, "/");
  }

  if (routeByPath.has(url.pathname)) return routeByPath.get(url.pathname);
  return null;
}

function localAssetPath(url) {
  if (!isLocalHost(url)) return null;
  if (routeForUrl(url)) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; InstComCienciaMirror/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url) {
  return (await fetchBuffer(url)).toString("utf8");
}

function safeUrl(value, baseUrl) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (/^(mailto|tel|javascript|data):/i.test(trimmed)) return null;

  try {
    return new URL(trimmed, baseUrl);
  } catch {
    return null;
  }
}

function queueAsset(value, baseUrl) {
  if (/^\/?ecoinf\.com\.br\/?$/i.test(value.trim())) return;

  const url = safeUrl(value, baseUrl);
  if (!url) return;

  const localPath = localAssetPath(url);
  if (!localPath) return;

  const key = `${url.origin}${url.pathname}`;
  if (downloadedAssets.has(key)) return;

  downloadedAssets.add(key);
  pendingAssets.push(url);
}

function collectSrcset(srcset, baseUrl) {
  for (const candidate of srcset.split(",")) {
    const value = candidate.trim().split(/\s+/)[0];
    queueAsset(value, baseUrl);
  }
}

function collectAssetsFromHtml(html, baseUrl) {
  const attrPattern = /\b(?:src|href|poster|data-src|data-bg|data-background)=["']([^"']+)["']/gi;
  let match;

  while ((match = attrPattern.exec(html))) {
    queueAsset(match[1], baseUrl);
  }

  const srcsetPattern = /\b(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  while ((match = srcsetPattern.exec(html))) {
    collectSrcset(match[1], baseUrl);
  }

  collectAssetsFromCssText(html, baseUrl);
}

function collectAssetsFromCssText(css, baseUrl) {
  const urlPattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let match;

  while ((match = urlPattern.exec(css))) {
    queueAsset(match[2], baseUrl);
  }
}

function rewriteUrlValue(value, baseUrl) {
  const original = value;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#")) return original;
  if (/^(mailto|tel|javascript|data):/i.test(trimmed)) return original;
  if (/^\/?ecoinf\.com\.br\/?$/i.test(trimmed)) return "https://ecoinf.com.br/";

  const url = safeUrl(trimmed, baseUrl);
  if (!url) return original;

  if (url.protocol === "http:" && url.hostname === "fonts.googleapis.com") {
    url.protocol = "https:";
    return url.href;
  }

  const route = routeForUrl(url);
  if (route) {
    return `${route}${url.hash}`;
  }

  if (isLocalHost(url)) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return original;
}

function rewriteSrcset(srcset, baseUrl) {
  return srcset
    .split(",")
    .map((candidate) => {
      const parts = candidate.trim().split(/\s+/);
      if (!parts[0]) return candidate;
      parts[0] = rewriteUrlValue(parts[0], baseUrl);
      return parts.join(" ");
    })
    .join(", ");
}

function rewriteHtml(html, pageUrl) {
  let output = html;

  output = output.replace(/<base\b[^>]*>\s*/gi, "");

  output = output.replace(
    /\b(src|href|poster|action|data-src|data-bg|data-background)=(")([^"]*)(")/gi,
    (match, attr, open, value, close) => `${attr}=${open}${rewriteUrlValue(value, pageUrl)}${close}`,
  );

  output = output.replace(
    /\b(src|href|poster|action|data-src|data-bg|data-background)=(')([^']*)(')/gi,
    (match, attr, open, value, close) => `${attr}=${open}${rewriteUrlValue(value, pageUrl)}${close}`,
  );

  output = output.replace(
    /\b(srcset|data-srcset)=(")([^"]*)(")/gi,
    (match, attr, open, value, close) => `${attr}=${open}${rewriteSrcset(value, pageUrl)}${close}`,
  );

  output = output.replace(
    /\b(srcset|data-srcset)=(')([^']*)(')/gi,
    (match, attr, open, value, close) => `${attr}=${open}${rewriteSrcset(value, pageUrl)}${close}`,
  );

  output = output.replaceAll(origin, "");
  output = output.replaceAll(`http://${alternateHost}`, "");
  output = output.replaceAll(`https://${alternateHost}`, "");
  output = output.replaceAll("http://fonts.googleapis.com", "https://fonts.googleapis.com");

  return output;
}

async function writeOutput(relativePath, content) {
  const outputPath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content);
}

async function mirrorPages() {
  for (const [source, output] of pages) {
    const pageUrl = new URL(source, origin);
    const html = await fetchText(pageUrl);
    collectAssetsFromHtml(html, pageUrl);
    await writeOutput(output, rewriteHtml(html, pageUrl));
    console.log(`page ${source} -> ${output}`);
  }
}

function queueExtraAssets() {
  for (const asset of extraAssets) {
    queueAsset(asset, origin);
  }
}

async function mirrorAssets() {
  for (let index = 0; index < pendingAssets.length; index += 1) {
    const assetUrl = pendingAssets[index];
    const relativePath = localAssetPath(assetUrl);
    if (!relativePath) continue;

    try {
      const buffer = await fetchBuffer(assetUrl);
      await writeOutput(relativePath, buffer);
      console.log(`asset ${assetUrl.pathname} -> ${relativePath}`);

      if (/\.(css)$/i.test(assetUrl.pathname)) {
        const css = buffer.toString("utf8");
        collectAssetsFromCssText(css, assetUrl);
      }
    } catch (error) {
      console.warn(`missing ${assetUrl.href}: ${error.message}`);
    }
  }
}

async function main() {
  await mirrorPages();
  queueExtraAssets();
  await mirrorAssets();

  const assetList = [...downloadedAssets].sort().join("\n");
  await mkdir(path.join(rootDir, ".mirror"), { recursive: true });
  await writeFile(path.join(rootDir, ".mirror", "assets.txt"), `${assetList}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
