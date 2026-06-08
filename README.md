# Instituto ComCiência - Clone estático

Clone estático do site Joomla publicado em:

http://instcomciencia.web2f02.uni5.net/index.php

## Estrutura principal

- `index.html` - Home
- `depoimentos-home/` - Depoimentos
- `sobre/` - Sobre
- `servicos/` - Serviços
- `profissionais/` - Profissionais
- `contato/` - Contato
- `cursos-de-formacao/` - Páginas de cursos
- `inscricao-workshop/` - Formulário do workshop
- `images/`, `templates/`, `components/`, `media/` - Assets copiados do Joomla
- `index.php` - Roteador opcional para manter URLs antigas em hospedagem PHP
- `tools/mirror-site.mjs` - Script para refazer o espelhamento do site antigo

## Rodar localmente

```bash
node server.js
```

Depois acesse:

```text
http://localhost:8000
```

## Atualizar o espelho

Se o site antigo ainda mudar antes da migração, rode:

```bash
node tools/mirror-site.mjs
```

O script baixa novamente as páginas principais e os assets do domínio antigo, reescrevendo os links internos para as novas URLs estáticas.

## Deploy

Para uma hospedagem comum, suba todo o conteúdo deste repositório para a raiz pública do domínio.

As URLs novas usam caminhos limpos, por exemplo:

- `/sobre/`
- `/contato/`
- `/cursos-de-formacao/consciencia-sistemica/`

Se a hospedagem tiver PHP, o arquivo `index.php` também atende URLs antigas do Joomla, como:

- `/index.php/sobre`
- `/index.php/contato`
- `/index.php/cursos-de-formacao/workshop`

## Formulários

Os formulários foram preservados visualmente, mas o envio original dependia do Joomla/RSForm no servidor antigo. Antes de colocar em produção, conecte os formulários a uma solução de envio, como PHP mail, SMTP autenticado ou um serviço externo.
