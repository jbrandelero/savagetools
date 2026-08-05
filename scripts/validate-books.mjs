// Validate every book JSON in public/data/books against the schema, and check
// manifest consistency + duplicate ids within a book.
// Run: npm run validate:books

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Ajv from 'ajv'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const booksDir = join(root, 'public', 'data', 'books')
const schema = JSON.parse(
  readFileSync(join(root, 'src', 'schema', 'book.schema.json'), 'utf8'),
)
const manifest = JSON.parse(
  readFileSync(join(root, 'public', 'data', 'manifest.json'), 'utf8'),
)

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

let errors = 0
const err = (msg) => {
  console.error('✗', msg)
  errors++
}

// Manifest -> files exist and referenced files are present.
const files = new Set(readdirSync(booksDir).filter((f) => f.endsWith('.json')))
for (const b of manifest.books) {
  if (!files.has(b.file)) err(`manifest references missing file: ${b.file}`)
}

for (const file of files) {
  const data = JSON.parse(readFileSync(join(booksDir, file), 'utf8'))
  if (!validate(data)) {
    for (const e of validate.errors) err(`${file} ${e.instancePath} ${e.message}`)
    continue
  }
  const ids = new Set()
  for (const entry of data.entries) {
    if (entry.id && ids.has(entry.id)) err(`${file}: duplicate id ${entry.id}`)
    if (entry.id) ids.add(entry.id)
  }
  console.log(`✓ ${file} — ${data.entries.length} entries`)
}

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`)
  process.exit(1)
}
console.log('\nAll books valid.')
