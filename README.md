# SavageTools

Um compêndio de consulta no estilo 5etools para **Savage Worlds Adventure
Edition (SWADE)** — multi-livro, bilíngue, offline-first e 100 % client-side.

_A reference compendium in the style of 5etools for **Savage Worlds Adventure
Edition (SWADE)** — multi-book, bilingual, offline-first and 100 % client-side._

---

# 🇧🇷 Português

## ⚠️ Isenção de responsabilidade

**Leia antes de usar.** O mesmo aviso aparece na página inicial e na página de
Livros do aplicativo.

Este é um aplicativo de consulta **não oficial, feito por fãs**, sem qualquer
afiliação, patrocínio ou endosso da Pinnacle Entertainment Group, de qualquer
editora licenciada ou de qualquer detentor de direitos. Savage Worlds, Savage
Worlds Edição Aventura (SWADE) e todos os nomes, logotipos e marcas
relacionados são marcas registradas de seus respectivos donos.

Este aplicativo **não hospeda, não distribui e não fornece nenhum conteúdo de
jogo próprio**. Cada livro fica exclusivamente no seu próprio navegador
(armazenamento local) e é carregado por você. Você é o único responsável por
garantir que possui os direitos sobre qualquer conteúdo que adicionar e pela
forma como o utiliza.

As regras, vantagens, poderes e demais textos dos livros de Savage Worlds são
protegidos por direitos autorais da Pinnacle Entertainment Group e das editoras
licenciadas. Por isso o aplicativo é apenas o **leitor**: nenhum texto oficial
acompanha uma instalação pública. Use a aba **Livros** para enviar o seu próprio
conteúdo (em JSON) ou criar material homebrew. Nada é enviado para servidor
algum — não existe backend, conta de usuário ou telemetria.

## Funcionalidades

### Biblioteca e livros

- **Multi-livro**: vários livros ativos ao mesmo tempo alimentam uma única
  consulta unificada.
- **Ligar/desligar livros** com um clique — na página inicial (pelas capas) ou
  na página de Livros.
- **Tudo no navegador (IndexedDB)**: os livros vivem só no seu dispositivo;
  nenhum dado sai dele.
- **Enviar livro (JSON)** — vários arquivos de uma vez, com validação e
  mensagens de erro claras.
- **Criar livro homebrew** direto na interface (título, sigla, idiomas).
- **Editar livros existentes**: ao editar um livro pré-carregado ele é
  "adotado" como livro do usuário e nunca mais é sobrescrito por atualizações.
- **Baixar/exportar** qualquer livro como JSON.
- **Remover livro** da biblioteca do navegador.
- **Capas embutidas**: cada livro carrega a capa como data URI base64 dentro do
  próprio JSON; livros sem capa recebem uma capa determinística gerada na hora.
- **Selo de idiomas** e **categoria** (Core / Compêndio / Homebrew / Exemplo) em
  cada livro.
- **Livro de exemplo** incluído como demonstração — ele some automaticamente
  assim que qualquer livro de verdade é adicionado.
- **Re-seed versionado**: quando os dados incluídos mudam, os livros de origem
  "seed" são atualizados sem tocar nos livros enviados por você.

### Consulta e navegação

- **10 tipos navegáveis**: Vantagens, Complicações, Poderes, Perícias,
  Equipamentos, Armas, Armaduras, Raças, Regras e Bestiário (Veículos entram em
  Equipamentos e Regras de Cenário em Regras).
- **Página inicial** com estante de capas, contagem por tipo e atalhos de
  navegação em duas linhas de cinco itens.
- **Visão dividida (split view)**: tabela à esquerda, ficha completa à direita.
- **Tabelas com colunas por tipo** (dano, PA, CDT, alcance, PP, duração,
  Resistência, Aparar…), ordenáveis por qualquer coluna.
- **Menu superior agrupado** ao estilo 5etools: Personagem, Poderes, Regras,
  Equipamento, Bestiário — com dropdowns.
- **Menu móvel** (hambúrguer) com toda a navegação em grade.
- **Omnisearch difuso** (Fuse.js) com atalho **Ctrl+K**, navegação por teclado
  e resultados ponderados (nome > tags > resumo > descrição).
- **Filtros facetados tri-estado** ao estilo 5etools: cada faceta (fonte, grau,
  categoria) cicla entre ignorar → exigir (azul) → excluir (vermelho), mais um
  campo de busca textual dentro da lista.
- **Autolink de termos**: qualquer nome de item reconhecido no texto vira link
  automaticamente, sem nenhuma marcação no JSON. O link prefere o mesmo livro,
  depois um livro Core — e nunca aponta para outro livro qualquer.
- **Prévia ao passar o mouse** no termo autolinkado, com selo da fonte.
- **Ignorar autolink**: termos que gerarem falso positivo podem ser silenciados
  individualmente e a escolha fica salva.
- **URLs compartilháveis** (hash router): tipo, filtro de categoria e item
  selecionado vivem na URL.

### Variações entre livros

- Itens que representam o **mesmo objeto de jogo** em livros diferentes são
  agrupados por uma chave canônica.
- **Seletor de variação** na ficha para escolher qual versão exibir; a escolha é
  lembrada por objeto.
- A tabela sinaliza quantas versões existem e permite **expandir a linha** para
  ver e escolher cada variação.

### Poderes

- **Construtor de Poderes**: escolha um poder e combine modificadores para ver o
  **custo total em PP** em tempo real.
- **Modificadores do próprio poder** extraídos automaticamente do texto da
  descrição (o bloco "Modificadores" é interpretado e listado).
- **Modificadores gerais** (categoria `modifier`) com página própria no menu.
- **Custos de múltiplos valores** (`+1/+2/+4`) com escolha do valor desejado.
- **Modificadores personalizados** (homebrew) por poder, com nome, PP e
  descrição.
- **Salvar combinações** nos Favoritos e reabrir/atualizar depois.

### Favoritos

- **Favoritar qualquer item** pela estrela ☆ na ficha.
- Página de **Favoritos** agrupada por tipo, com as combinações de poder salvas.
- Favoritos de livros desativados continuam listados, marcados como
  indisponíveis.

### Idiomas

- **Idioma da interface**: Português (pt-BR) e Inglês (en).
- **Idioma do conteúdo**: independente da interface; as opções vêm dos idiomas
  que os livros ativos declaram.
- **Fallback gracioso**: correspondência exata → idioma base → primeiro idioma
  disponível.
- **Um livro carrega vários idiomas**: qualquer campo de texto (`name`,
  `summary`, `description`, `requirements`) pode ser um texto simples ou um mapa
  `{ "pt-BR": …, "en": … }`.

### Edição de conteúdo

- **Editor de itens** embutido: criar, editar e excluir entradas em qualquer
  livro do usuário.
- **Campos por tipo**: o formulário mostra os campos certos para arma,
  armadura, equipamento, poder, perícia e criatura.
- **Chave canônica automática** (derivada do tipo + nome em inglês), com opção
  de definir manualmente para casar variações entre edições traduzidas.
- **Notificações (toasts)** ao salvar.

### Aplicativo

- **PWA instalável** (manifest + service worker) com botão "Instalar app".
- **Tema claro/escuro** com alternância no topo, persistido.
- **Layout de altura fixa** com rolagem só na área de conteúdo — e a barra de
  rolagem só aparece quando é realmente necessária.
- **Preferências persistidas** (livros ativos, favoritos, variações, tema,
  idiomas, combinações, links ignorados) via `localStorage`.
- **Zero backend**: build estático, sem conta, sem servidor, sem telemetria.

## Como rodar

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + build de produção
npm run typecheck      # só a checagem de tipos
npm run validate:books # valida todos os JSONs de livro contra o schema
```

## Formato do livro

```jsonc
{
  "id": "meu-livro",
  "title": "Meu Livro",
  "abbrev": "ML",
  "languages": ["pt-BR", "en"],
  "category": "homebrew",              // core | compendium | homebrew | example
  "cover": "data:image/jpeg;base64,…", // opcional — uma capa é gerada se faltar
  "entries": [ /* ... */ ]
}
```

### Formato da entrada

```jsonc
{
  "id": "edge.alerta",
  "key": "edge:alertness",        // chave canônica de deduplicação (sempre em inglês)
  "type": "edge",                 // edge | hindrance | power | skill | gear |
                                  // weapon | armor | vehicle | ancestry |
                                  // rule | setting-rule | bestiary
  "name": { "pt-BR": "Alerta", "en": "Alertness" },
  "category": "background",
  "rank": "novice",               // novice | seasoned | veteran | heroic | legendary
  "requirements": "…",
  "summary": "…",
  "description": "…",
  "page": 40,
  "tags": [],
  "fields": {}                    // dados por tipo (pp, damage, range, …)
}
```

Só `id`, `type` e `name` são obrigatórios. **`id` e `key` são sempre em inglês**
(estáveis entre idiomas) e são derivados automaticamente do tipo + nome em
inglês quando omitidos. Um livro só em português precisa definir `key`
explicitamente em inglês (ex.: `"key": "edge:alertness"`) para se alinhar como
variação de um objeto já existente.

## Estrutura do projeto

```
public/data/
  manifest.json              livros disponíveis para o seed inicial
  books/*.json               um arquivo por livro
src/
  types/                     modelos Entry / Book
  schema/book.schema.json    JSON Schema (usado por validate:books)
  data/loader.ts             carrega e normaliza livros
  data/db.ts                 persistência em IndexedDB
  data/columns.tsx           colunas de tabela por tipo
  lib/                       dedupe, filtros, busca, texto localizado, fontes,
                             construtor de poderes
  store/useLibrary.ts        livros ativos, preferências, tema, idiomas
  hooks/                     seletores derivados (grupos, entradas, i18n, PWA)
  components/                NavBar, DataTable, FilterBox, Omnisearch,
                             EntryView, EntryEditor, PowerBuilderPanel…
  pages/                     Home, Browse, EntryDetail, Favorites, Books
  i18n/                      dicionários de interface (en, pt-BR)
scripts/validate-books.mjs   validação dos livros
```

## Stack

- Vite + React 18 + TypeScript
- React Router (hash router)
- Zustand + persistência em `localStorage`
- IndexedDB para os livros
- Fuse.js para a busca difusa
- Tailwind CSS (tema escuro por padrão)

## Desenvolvido com Claude

Este projeto foi **desenvolvido usando o [Claude](https://claude.ai) (Claude
Code), da Anthropic** — da arquitetura do aplicativo e dos componentes React ao
formato de livro em JSON e à documentação que você está lendo.

## Créditos

- Ícone do app: “Mighty spanner” de [Lorc](https://lorcblog.blogspot.com/) via
  [game-icons.net](https://game-icons.net/1x1/lorc/mighty-spanner.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Ícone de Curinga (Encontros): “Card joker” de
  [Delapouite](https://delapouite.com/) via
  [game-icons.net](https://game-icons.net/1x1/delapouite/card-joker.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Ícone de Estados (Encontros): “Power button” de
  [Lord Berandas](https://www.deviantart.com/berandas) via
  [game-icons.net](https://game-icons.net/1x1/lord-berandas/power-button.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Ícone de Incapacitado (Encontros): “Dead head” de
  [Delapouite](https://delapouite.com/) via
  [game-icons.net](https://game-icons.net/1x1/delapouite/dead-head.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Ícone de Abalado (Encontros): “Helmet head shot” de
  [Lorc](https://lorcblog.blogspot.com/) via
  [game-icons.net](https://game-icons.net/1x1/lorc/helmet-head-shot.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

---

# 🇬🇧 English

## ⚠️ Disclaimer

**Read before using.** The same notice is shown on the app's Home and Books
pages.

This is an **unofficial, fan-made** reference tool with no affiliation with,
sponsorship by, or endorsement from Pinnacle Entertainment Group, any licensed
publisher, or any rights holder. Savage Worlds, the Savage Worlds Adventure
Edition (SWADE), and all related names, logos, and marks are trademarks of their
respective owners.

This application **hosts, distributes, and provides no game content of its
own**. Every book lives solely in your own browser (local storage) and is loaded
there by you. You alone are responsible for ensuring you hold the rights to any
content you add, and for how you use it.

The rules, edges, powers and other text from the Savage Worlds books are
copyrighted by Pinnacle Entertainment Group and its licensed publishers. That is
why the app is only the **reader**: no official text ships with a public
install. Use the **Books** tab to upload your own content (as JSON) or create
homebrew. Nothing is ever sent to a server — there is no backend, no user
account and no telemetry.

## Features

### Library and books

- **Multi-book**: any number of active books feed a single unified compendium.
- **Toggle books on/off** with one click — from the Home page (cover shelf) or
  the Books page.
- **Everything in the browser (IndexedDB)**: books live on your device only;
  no data ever leaves it.
- **Upload books (JSON)** — several files at once, with validation and clear
  error messages.
- **Create a homebrew book** right in the UI (title, abbreviation, languages).
- **Edit existing books**: editing a bundled book "adopts" it as a user book, so
  data updates never overwrite your changes.
- **Download/export** any book as JSON.
- **Remove a book** from the browser library.
- **Embedded covers**: each book carries its cover as a base64 data URI inside
  the JSON; books without one get a deterministic generated cover.
- **Language badge** and **category** (Core / Compendium / Homebrew / Example)
  on every book.
- **Bundled example book** as a starter demo — it disappears automatically as
  soon as any real book is added.
- **Versioned re-seed**: when bundled data changes, seed-origin books refresh
  without touching the books you uploaded.

### Browsing and lookup

- **10 browsable types**: Edges, Hindrances, Powers, Skills, Gear, Weapons,
  Armor, Ancestries, Rules and Bestiary (Vehicles fold into Gear and Setting
  Rules into Rules).
- **Home page** with a cover shelf, per-type counts and navigation shortcuts
  laid out as two rows of five.
- **Split view**: table on the left, full entry sheet on the right.
- **Per-type table columns** (damage, AP, RoF, range, PP, duration, Toughness,
  Parry…), sortable by any column.
- **Grouped top nav**, 5etools-style: Character, Powers, Rules, Gear, Bestiary —
  with dropdowns.
- **Mobile menu** (hamburger) with the whole navigation in a grid.
- **Fuzzy omnisearch** (Fuse.js) with a **Ctrl+K** shortcut, keyboard navigation
  and weighted results (name > tags > summary > description).
- **Tri-state faceted filters**, 5etools-style: each facet (source, rank,
  category) cycles ignore → require (blue) → exclude (red), plus a text filter
  over the list.
- **Automatic term linking**: any recognized entry name inside a text becomes a
  link with no markup in the JSON. Links prefer the same book, then a Core book
  — never an arbitrary other book.
- **Hover preview** on linked terms, with a source badge.
- **Ignore a link**: false-positive terms can be silenced individually and the
  choice is remembered.
- **Shareable URLs** (hash router): type, category filter and selected entry all
  live in the URL.

### Variations across books

- Entries that represent the **same game object** in different books are grouped
  under one canonical key.
- A **variation picker** on the entry sheet chooses which version to show; the
  choice is remembered per object.
- The table flags how many versions exist and lets you **expand the row** to see
  and pick each variation.

### Powers

- **Power Builder**: pick a power, stack modifiers and see the **total PP cost**
  update live.
- **The power's own modifiers** are parsed straight out of its description text
  (the "Modifiers" block is detected and listed).
- **General modifiers** (category `modifier`) get their own menu entry.
- **Multi-value costs** (`+1/+2/+4`) with a picker for the chosen value.
- **Custom (homebrew) modifiers** per power, with name, PP and description.
- **Save combinations** to Favorites and reopen/update them later.

### Favorites

- **Favorite any entry** with the ☆ star on its sheet.
- A **Favorites** page grouped by type, alongside saved power combinations.
- Favorites from disabled books stay listed, marked as unavailable.

### Languages

- **Interface language**: Portuguese (pt-BR) and English (en).
- **Content language**: independent from the interface; the options come from
  the languages the active books declare.
- **Graceful fallback**: exact match → base language → first available.
- **One book carries many languages**: any text field (`name`, `summary`,
  `description`, `requirements`) may be a plain string or a
  `{ "pt-BR": …, "en": … }` map.

### Content editing

- **Built-in entry editor**: create, edit and delete entries in any user book.
- **Per-type fields**: the form shows the right fields for weapon, armor, gear,
  power, skill and creature entries.
- **Automatic canonical key** (derived from type + English name), with a manual
  override so translated editions line up as variations.
- **Toast notifications** on save.

### App

- **Installable PWA** (manifest + service worker) with an "Install app" button.
- **Light/dark theme** toggle in the top bar, persisted.
- **Fixed-height layout** with scrolling confined to the content area — and the
  scrollbar only appears when it is actually needed.
- **Persisted preferences** (active books, favorites, variations, theme,
  languages, power builds, ignored links) via `localStorage`.
- **Zero backend**: static build, no account, no server, no telemetry.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production build
npm run typecheck      # type check only
npm run validate:books # validate every book JSON against the schema
```

## Book format

```jsonc
{
  "id": "my-book",
  "title": "My Book",
  "abbrev": "MB",
  "languages": ["pt-BR", "en"],
  "category": "homebrew",              // core | compendium | homebrew | example
  "cover": "data:image/jpeg;base64,…", // optional — one is generated if missing
  "entries": [ /* ... */ ]
}
```

### Entry format

```jsonc
{
  "id": "edge.alerta",
  "key": "edge:alertness",        // canonical dedup key (always English)
  "type": "edge",                 // edge | hindrance | power | skill | gear |
                                  // weapon | armor | vehicle | ancestry |
                                  // rule | setting-rule | bestiary
  "name": { "pt-BR": "Alerta", "en": "Alertness" },
  "category": "background",
  "rank": "novice",               // novice | seasoned | veteran | heroic | legendary
  "requirements": "…",
  "summary": "…",
  "description": "…",
  "page": 40,
  "tags": [],
  "fields": {}                    // type-specific data (pp, damage, range, …)
}
```

Only `id`, `type` and `name` are required. **`id` and `key` are always in
English** (language-stable) and are auto-derived from type + the English name
when omitted. A Portuguese-only book must set `key` explicitly in English (e.g.
`"key": "edge:alertness"`) to line up as a variation of an existing object.

## Project layout

```
public/data/
  manifest.json              books available for the initial seed
  books/*.json               one file per book
src/
  types/                     Entry / Book models
  schema/book.schema.json    JSON Schema (used by validate:books)
  data/loader.ts             fetch + normalize books
  data/db.ts                 IndexedDB persistence
  data/columns.tsx           per-type table columns
  lib/                       dedupe, filters, search, localized text, sources,
                             power builder
  store/useLibrary.ts        active books, prefs, theme, languages
  hooks/                     derived selectors (groups, entries, i18n, PWA)
  components/                NavBar, DataTable, FilterBox, Omnisearch,
                             EntryView, EntryEditor, PowerBuilderPanel…
  pages/                     Home, Browse, EntryDetail, Favorites, Books
  i18n/                      UI dictionaries (en, pt-BR)
scripts/validate-books.mjs   book validation
```

## Stack

- Vite + React 18 + TypeScript
- React Router (hash router)
- Zustand + `localStorage` persistence
- IndexedDB for the books
- Fuse.js fuzzy search
- Tailwind CSS (dark theme by default)

## Built with Claude

This project was **developed using [Claude](https://claude.ai) (Claude Code) by
Anthropic** — from the app architecture and React components to the book JSON
format and the documentation you are reading.

## Credits

- App icon: “Mighty spanner” by [Lorc](https://lorcblog.blogspot.com/) via
  [game-icons.net](https://game-icons.net/1x1/lorc/mighty-spanner.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Wild Card icon (Encounters): “Card joker” by
  [Delapouite](https://delapouite.com/) via
  [game-icons.net](https://game-icons.net/1x1/delapouite/card-joker.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- States icon (Encounters): “Power button” by
  [Lord Berandas](https://www.deviantart.com/berandas) via
  [game-icons.net](https://game-icons.net/1x1/lord-berandas/power-button.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Incapacitated icon (Encounters): “Dead head” by
  [Delapouite](https://delapouite.com/) via
  [game-icons.net](https://game-icons.net/1x1/delapouite/dead-head.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Shaken icon (Encounters): “Helmet head shot” by
  [Lorc](https://lorcblog.blogspot.com/) via
  [game-icons.net](https://game-icons.net/1x1/lorc/helmet-head-shot.html) —
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
