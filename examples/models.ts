/**
 * Models API — list and retrieve available models
 *
 * Run:  npx tsx models.ts
 *
 * Covers:
 *   - Listing all models
 *   - Retrieving a single model by ID
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()

// -------------------------------------------------------------------------
// 1. List all models
// -------------------------------------------------------------------------
async function listModels() {
  console.log('--- List models ---')

  const res = await client.models.list()

  for (const model of res.data) {
    console.log(`  ${model.id.padEnd(36)} ${model.owned_by}`)
  }

  console.log(`\nTotal: ${res.data.length} models\n`)
}

// -------------------------------------------------------------------------
// 2. Retrieve a specific model
// -------------------------------------------------------------------------
async function retrieveModel() {
  console.log('--- Retrieve model ---')

  const model = await client.models.retrieve('gpt-5.4')
  console.log(`ID:       ${model.id}`)
  console.log(`Object:   ${model.object}`)
  console.log(`Created:  ${model.created}`)
  console.log(`Owned by: ${model.owned_by}`)
  console.log()
}

// -------------------------------------------------------------------------

await listModels()
await retrieveModel()
