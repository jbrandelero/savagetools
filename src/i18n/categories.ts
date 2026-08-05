// Display names for entry `category` slugs, in pt-BR and en. Unknown slugs fall
// back to a prettified version of the slug (hyphens → spaces, title-cased).

type Pair = { 'pt-BR': string; en: string }

const CATS: Record<string, Pair> = {
  // edges
  background: { 'pt-BR': 'Antecedente', en: 'Background' },
  ancestry: { 'pt-BR': 'Ancestralidade', en: 'Ancestry' },
  combat: { 'pt-BR': 'Combate', en: 'Combat' },
  power: { 'pt-BR': 'Poder', en: 'Power' },
  professional: { 'pt-BR': 'Profissional', en: 'Professional' },
  social: { 'pt-BR': 'Social', en: 'Social' },
  weird: { 'pt-BR': 'Estranha', en: 'Weird' },
  legendary: { 'pt-BR': 'Lendária', en: 'Legendary' },
  leadership: { 'pt-BR': 'Liderança', en: 'Leadership' },
  // hindrances
  minor: { 'pt-BR': 'Menor', en: 'Minor' },
  major: { 'pt-BR': 'Maior', en: 'Major' },
  'minor/major': { 'pt-BR': 'Menor ou Maior', en: 'Minor or Major' },
  // rules buckets
  core: { 'pt-BR': 'Básica', en: 'Core' },
  situational: { 'pt-BR': 'Situacional', en: 'Situational' },
  tools: { 'pt-BR': 'Ferramentas', en: 'Tools' },
  gm: { 'pt-BR': 'Mestre', en: 'GM' },
  attribute: { 'pt-BR': 'Atributo', en: 'Attribute' },
  'derived-stat': { 'pt-BR': 'Característica Derivada', en: 'Derived Stat' },
  'character-creation': { 'pt-BR': 'Criação de Personagem', en: 'Character Creation' },
  arcane: { 'pt-BR': 'Arcano', en: 'Arcane' },
  'arcane-background': { 'pt-BR': 'Antecedente Arcano', en: 'Arcane Background' },
  powers: { 'pt-BR': 'Poderes', en: 'Powers' },
  modifier: { 'pt-BR': 'Modificador', en: 'Modifier' },
  'monster-ability': { 'pt-BR': 'Habilidade de Criatura', en: 'Monster Ability' },
  'monster-variant': { 'pt-BR': 'Variante de Criatura', en: 'Monster Variant' },
  'ancestry-ability': { 'pt-BR': 'Habilidade Racial', en: 'Racial Ability' },
  'ancestry-rules': { 'pt-BR': 'Regras de Ancestralidade', en: 'Ancestry Rules' },
  'culture-package': { 'pt-BR': 'Pacote Cultural', en: 'Culture Package' },
  'monstrous-hero': { 'pt-BR': 'Herói Monstruoso', en: 'Monstrous Hero' },
  archetype: { 'pt-BR': 'Arquétipo', en: 'Archetype' },
  setting: { 'pt-BR': 'Ambientação', en: 'Setting' },
  sanity: { 'pt-BR': 'Sanidade', en: 'Sanity' },
  hazard: { 'pt-BR': 'Perigo', en: 'Hazard' },
  material: { 'pt-BR': 'Material', en: 'Material' },
  // styles
  'fantasy-style': { 'pt-BR': 'Estilo de Fantasia', en: 'Fantasy Style' },
  'horror-style': { 'pt-BR': 'Estilo de Horror', en: 'Horror Style' },
  'scifi-style': { 'pt-BR': 'Estilo de Ficção Científica', en: 'Sci-Fi Style' },
  'supers-style': { 'pt-BR': 'Estilo de Supers', en: 'Supers Style' },
  // bases
  hideout: { 'pt-BR': 'Refúgio', en: 'Hideout' },
  stronghold: { 'pt-BR': 'Fortaleza', en: 'Stronghold' },
  headquarters: { 'pt-BR': 'Quartel-General', en: 'Headquarters' },
  outpost: { 'pt-BR': 'Posto Avançado', en: 'Outpost' },
  // items
  treasure: { 'pt-BR': 'Tesouro', en: 'Treasure' },
  'magic-item': { 'pt-BR': 'Item Mágico', en: 'Magic Item' },
  'arcane-item': { 'pt-BR': 'Item Arcano', en: 'Arcane Item' },
  'arcane-item-rules': { 'pt-BR': 'Regras de Item Arcano', en: 'Arcane Item Rules' },
  'alchemical-item': { 'pt-BR': 'Item Alquímico', en: 'Alchemical Item' },
  'power-item': { 'pt-BR': 'Item de Poder', en: 'Power Item' },
  'power-item-rules': { 'pt-BR': 'Regras de Item de Poder', en: 'Power Item Rules' },
  cyberware: { 'pt-BR': 'Ciberequipamento', en: 'Cyberware' },
  'cyberware-rules': { 'pt-BR': 'Regras de Ciberequipamento', en: 'Cyberware Rules' },
  'gear-rules': { 'pt-BR': 'Regras de Equipamento', en: 'Gear Rules' },
  ammunition: { 'pt-BR': 'Munição', en: 'Ammunition' },
  adventuring: { 'pt-BR': 'Aventura', en: 'Adventuring' },
  clothing: { 'pt-BR': 'Vestuário', en: 'Clothing' },
  food: { 'pt-BR': 'Comida', en: 'Food' },
  // armor / weapon / vehicle
  medieval: { 'pt-BR': 'Medieval', en: 'Medieval' },
  modern: { 'pt-BR': 'Moderna', en: 'Modern' },
  futuristic: { 'pt-BR': 'Futurista', en: 'Futuristic' },
  shield: { 'pt-BR': 'Escudo', en: 'Shield' },
  energy: { 'pt-BR': 'Energia', en: 'Energy' },
  melee: { 'pt-BR': 'Corpo a Corpo', en: 'Melee' },
  ranged: { 'pt-BR': 'À Distância', en: 'Ranged' },
  firearm: { 'pt-BR': 'Arma de Fogo', en: 'Firearm' },
  special: { 'pt-BR': 'Especial', en: 'Special' },
  ground: { 'pt-BR': 'Terrestre', en: 'Ground' },
  air: { 'pt-BR': 'Aéreo', en: 'Air' },
  watercraft: { 'pt-BR': 'Embarcação', en: 'Watercraft' },
  spaceship: { 'pt-BR': 'Espaçonave', en: 'Spaceship' },
  mecha: { 'pt-BR': 'Mecha', en: 'Mecha' },
  walker: { 'pt-BR': 'Andador', en: 'Walker' },
  'power-armor': { 'pt-BR': 'Armadura Energizada', en: 'Power Armor' },
}

function prettify(slug: string): string {
  return slug
    .split(/[-/]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function categoryLabel(slug: string | undefined, lang: string): string {
  if (!slug) return ''
  const key = lang.startsWith('pt') ? 'pt-BR' : 'en'
  const hit = CATS[slug]
  if (hit) return hit[key]
  return prettify(slug)
}
