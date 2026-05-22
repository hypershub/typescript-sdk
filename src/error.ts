export class HypersHubError extends Error {
  readonly status: number
  readonly statusText: string
  readonly body: unknown

  constructor(status: number, statusText: string, body: unknown) {
    const err = body as Record<string, unknown> | null
    const rawMessage = err?.error && typeof err.error === 'object'
      ? (err.error as Record<string, unknown>).message
      : undefined
    const message = typeof rawMessage === 'string' && rawMessage.length > 0
      ? rawMessage
      : `HypersHub API error: HTTP ${status}${statusText ? ' ' + statusText : ''}`
    super(message)
    this.name = 'HypersHubError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }

  static isHypersHubError(err: unknown): err is HypersHubError {
    return err instanceof HypersHubError
  }
}

export class HypersHubAuthError extends HypersHubError {}
export class HypersHubRateLimitError extends HypersHubError {}
export class HypersHubInsufficientBalanceError extends HypersHubError {}

export function createError(status: number, statusText: string, body: unknown): HypersHubError {
  if (status === 401) return new HypersHubAuthError(status, statusText, body)
  if (status === 429) return new HypersHubRateLimitError(status, statusText, body)
  if (status === 402) return new HypersHubInsufficientBalanceError(status, statusText, body)
  return new HypersHubError(status, statusText, body)
}
