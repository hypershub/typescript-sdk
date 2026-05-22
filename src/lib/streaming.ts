/**
 * Parses a standard SSE (Server-Sent Events) stream and yields parsed JSON objects.
 * Terminates when the `data: [DONE]` sentinel is received.
 */
export async function* parseSSE<T>(response: Response): AsyncGenerator<T> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is null')
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') return
        try {
          yield JSON.parse(data) as T
        } catch {
          // Skip malformed SSE lines
          console.warn('[hypershub] Failed to parse SSE chunk:', data)
        }
      }
    }
    // Flush remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data !== '[DONE]') {
        try {
          yield JSON.parse(data) as T
        } catch {
          console.warn('[hypershub] Failed to parse SSE chunk:', data)
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
