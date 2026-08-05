// A complete, fictional homebrew book used as the "how to create content"
// example on the Books page. All data here is invented — no real game text.

export const EXAMPLE_BOOK = `{
  "id": "homebrew-vale-sombrio",
  "title": "Compêndio Homebrew do Vale Sombrio",
  "abbrev": "VS",
  "languages": ["pt-BR", "en"],
  "version": "1.0",
  "publisher": "Seu Nome Aqui",
  "cover": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...(opcional, corte aqui)",
  "entries": [
    {
      "type": "ancestry",
      "name": { "pt-BR": "Trollkin", "en": "Trollkin" },
      "summary": { "pt-BR": "Descendentes robustos de trolls domesticados." },
      "description": {
        "pt-BR": "Robustez: +1 de Resistência.\\nRegeneração Lenta: role Vigor a cada rodada para recuperar Ferimentos.\\nMedo de Fogo: -1 em testes contra fogo."
      },
      "tags": ["homebrew"]
    },
    {
      "type": "edge",
      "name": { "pt-BR": "Fôlego Dracônico", "en": "Draconic Breath" },
      "category": "background",
      "rank": "novice",
      "requirements": { "pt-BR": "Novato, Vigor d8+" },
      "summary": { "pt-BR": "Cospe uma baforada de energia." },
      "description": {
        "pt-BR": "Uma vez por combate, causa 2d6 de dano em um Modelo de Cone."
      }
    },
    {
      "type": "hindrance",
      "name": { "pt-BR": "Maldição da Lua", "en": "Moon Curse" },
      "category": "major",
      "description": {
        "pt-BR": "Nas noites de lua cheia, o personagem sofre -2 em testes de Espírito."
      }
    },
    {
      "type": "power",
      "name": { "pt-BR": "Chama Espectral", "en": "Spectral Flame" },
      "rank": "seasoned",
      "summary": { "pt-BR": "Fogo frio que ignora armadura." },
      "description": {
        "pt-BR": "Causa 2d8 de dano ignorando armadura não mágica.\\nModificadores: Persistente (+2 PP)."
      },
      "fields": {
        "pp": "3",
        "range": { "pt-BR": "Esperteza" },
        "duration": { "pt-BR": "Instantâneo" }
      }
    },
    {
      "type": "skill",
      "name": { "pt-BR": "Runas", "en": "Runes" },
      "description": { "pt-BR": "Perícia para gravar e ativar runas mágicas." },
      "fields": { "attribute": { "pt-BR": "Esperteza", "en": "Smarts" } }
    },
    {
      "type": "weapon",
      "name": { "pt-BR": "Lâmina Cinza", "en": "Grey Blade" },
      "category": "melee",
      "fields": { "damage": "For+d8", "minStr": "d6", "weight": "3", "cost": "500" }
    },
    {
      "type": "armor",
      "name": { "pt-BR": "Casaco Rúnico", "en": "Runic Coat" },
      "category": "medieval",
      "fields": { "armor": "3", "minStr": "d6", "weight": "8", "cost": "600" }
    },
    {
      "type": "gear",
      "name": { "pt-BR": "Poção de Névoa", "en": "Mist Potion" },
      "category": "magic-item",
      "summary": { "pt-BR": "Cria uma cortina de fumaça." },
      "description": { "pt-BR": "Cria um Modelo Grande de fumaça por 3 rodadas." },
      "fields": { "cost": "150", "weight": "0,5" }
    },
    {
      "type": "setting-rule",
      "name": { "pt-BR": "Fôlego Heroico", "en": "Heroic Grit" },
      "description": {
        "pt-BR": "Heróis começam com 1 Bene extra e recuperam Abalado automaticamente."
      }
    },
    {
      "type": "bestiary",
      "name": { "pt-BR": "Espreitador do Pântano", "en": "Bog Lurker" },
      "summary": { "pt-BR": "Predador anfíbio que ataca das águas rasas." },
      "description": {
        "pt-BR": "Um horror coberto de limo que arrasta presas para o fundo."
      },
      "fields": {
        "wildCard": true,
        "attributes": { "pt-BR": "Agilidade d8, Esperteza d6, Espírito d6, Força d10, Vigor d8" },
        "skills": { "pt-BR": "Lutar d8, Perceber d6, Furtividade d10" },
        "pace": "6",
        "parry": "6",
        "toughness": "8 (2)",
        "specialAbilities": {
          "pt-BR": "Aquático: nada com Deslocamento 8.\\nGarras: For+d6.\\nAgarrar: com um aumento no ataque, a vítima fica Presa.\\nBlindado: Armadura +2."
        }
      }
    },
    {
      "type": "rule",
      "name": { "pt-BR": "Criando Runas", "en": "Crafting Runes" },
      "category": "gear-rules",
      "description": {
        "pt-BR": "Gaste 1 hora e faça um teste de Runas. Sucesso grava 1 runa; um aumento grava 2."
      }
    }
  ]
}
`
