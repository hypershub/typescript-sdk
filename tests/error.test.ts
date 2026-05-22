import { describe, it, expect } from 'vitest'
import {
  HypersHubError,
  HypersHubAuthError,
  HypersHubRateLimitError,
  HypersHubInsufficientBalanceError,
  createError,
} from '../src/error.js'

describe('HypersHubError', () => {
  it('extracts message from body.error.message', () => {
    const err = new HypersHubError(500, 'Internal Server Error', {
      error: { message: 'Something went wrong' },
    })
    expect(err.message).toBe('Something went wrong')
    expect(err.status).toBe(500)
    expect(err.statusText).toBe('Internal Server Error')
  })

  it('falls back to generic message when body has no error.message', () => {
    const err = new HypersHubError(500, 'Internal Server Error', null)
    expect(err.message).toBe('HypersHub API error: HTTP 500 Internal Server Error')
  })

  it('sets name to HypersHubError', () => {
    const err = new HypersHubError(500, 'Err', {})
    expect(err.name).toBe('HypersHubError')
  })

  it('isHypersHubError returns true for instances', () => {
    const err = new HypersHubError(500, 'Err', {})
    expect(HypersHubError.isHypersHubError(err)).toBe(true)
  })

  it('isHypersHubError returns false for non-instances', () => {
    expect(HypersHubError.isHypersHubError(new Error('plain'))).toBe(false)
    expect(HypersHubError.isHypersHubError(null)).toBe(false)
  })
})

describe('createError', () => {
  it('returns HypersHubAuthError for 401', () => {
    const err = createError(401, 'Unauthorized', {})
    expect(err).toBeInstanceOf(HypersHubAuthError)
    expect(err.status).toBe(401)
  })

  it('returns HypersHubRateLimitError for 429', () => {
    const err = createError(429, 'Too Many Requests', {})
    expect(err).toBeInstanceOf(HypersHubRateLimitError)
    expect(err.status).toBe(429)
  })

  it('returns HypersHubInsufficientBalanceError for 402', () => {
    const err = createError(402, 'Payment Required', {})
    expect(err).toBeInstanceOf(HypersHubInsufficientBalanceError)
    expect(err.status).toBe(402)
  })

  it('returns base HypersHubError for other status codes', () => {
    const err = createError(500, 'Internal Server Error', {})
    expect(err.constructor).toBe(HypersHubError)
    expect(err.status).toBe(500)
  })
})
