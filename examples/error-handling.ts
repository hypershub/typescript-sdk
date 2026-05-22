/**
 * Error Handling
 *
 * Run:  npx tsx error-handling.ts
 *
 * Demonstrates catching and distinguishing the various
 * HypersHub error types.
 *
 * NOTE: The first call uses an invalid API key to trigger
 * a 401 on purpose — the rest will not run if it fails.
 */

import 'dotenv/config'
import {
  HypersHub,
  HypersHubError,
  HypersHubAuthError,
  HypersHubRateLimitError,
  HypersHubInsufficientBalanceError,
} from '@hypershub/sdk'

async function simulateErrors() {
  // -----------------------------------------------------------------------
  // Auth error (401)
  // -----------------------------------------------------------------------
  {
    const badClient = new HypersHub({ apiKey: 'sk-hy-invalid-key' })

    try {
      await badClient.models.list()
    } catch (err) {
      if (err instanceof HypersHubAuthError) {
        console.log('✓ AuthError caught:')
        console.log(`  status=${err.status}, message=${err.message}\n`)
      } else {
        throw err
      }
    }
  }

  // -----------------------------------------------------------------------
  // Generic error from the HypersHubError hierarchy
  // -----------------------------------------------------------------------
  {
    const client = new HypersHub()

    try {
      // Empty messages will trigger a validation/API error
      await client.chat.completions.create({
        model: 'gpt-5.4',
        messages: [],
      })
    } catch (err) {
      // HypersHubError.isHypersHubError() is a type guard
      if (HypersHubError.isHypersHubError(err)) {
        console.log('✓ HypersHubError caught:')
        console.log(`  status=${err.status}, message=${err.message}`)
        console.log(`  body=${err.body}\n`)
      } else {
        throw err
      }
    }
  }

  // -----------------------------------------------------------------------
  // Type guard usage
  // -----------------------------------------------------------------------
  {
    const client = new HypersHub()

    try {
      await client.chat.completions.create({
        model: 'gpt-5.4',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: -1, // invalid value
      })
    } catch (err) {
      if (HypersHubError.isHypersHubError(err)) {
        switch (err.status) {
          case 401:
            console.log('Auth error — check your API key')
            break
          case 402:
            console.log('Insufficient balance — top up your account')
            break
          case 429:
            console.log('Rate limited — implement retry with backoff')
            break
          default:
            console.log(`API error ${err.status}: ${err.message}`)
        }
      } else {
        // Non-API error (network, timeout, etc.)
        console.log('Non-API error:', err)
      }
    }
  }
}

await simulateErrors()
