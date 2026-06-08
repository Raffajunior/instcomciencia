<?php

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$query = $_SERVER["QUERY_STRING"] ?? "";

$routes = [
    "/index.php" => "index.html",
    "/index.php/" => "index.html",
    "/index.php/depoimentos-home" => "depoimentos-home/index.html",
    "/index.php/sobre" => "sobre/index.html",
    "/index.php/cursos-de-formacao/workshop" => "cursos-de-formacao/workshop/index.html",
    "/index.php/cursos-de-formacao/workshop-2" => "cursos-de-formacao/workshop-2/index.html",
    "/index.php/cursos-de-formacao/consciencia-sistemica" => "cursos-de-formacao/consciencia-sistemica/index.html",
    "/index.php/cursos-de-formacao/constelacao-familiar" => "cursos-de-formacao/constelacao-familiar/index.html",
    "/index.php/cursos-de-formacao/educacao-sistemica" => "cursos-de-formacao/educacao-sistemica/index.html",
    "/index.php/servicos" => "servicos/index.html",
    "/index.php/profissionais" => "profissionais/index.html",
    "/index.php/contato" => "contato/index.html",
];

if ($path === "/index.php" && str_contains($query, "option=com_rsform") && str_contains($query, "formId=7")) {
    $file = "inscricao-workshop/index.html";
} elseif (isset($routes[$path])) {
    $file = $routes[$path];
} else {
    $prettyPath = trim(preg_replace("#^/index\\.php/?#", "", $path), "/");
    $candidate = $prettyPath === "" ? "index.html" : $prettyPath . "/index.html";
    $file = is_file(__DIR__ . "/" . $candidate) ? $candidate : null;
}

if ($file === null || !is_file(__DIR__ . "/" . $file)) {
    http_response_code(404);
    header("Content-Type: text/html; charset=UTF-8");
    readfile(__DIR__ . "/index.html");
    exit;
}

header("Content-Type: text/html; charset=UTF-8");
readfile(__DIR__ . "/" . $file);
