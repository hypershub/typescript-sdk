import type { HypersHubClient } from '../hypershub.js'
import { parseSSE } from '../lib/streaming.js'
import type {
  GenerateContentRequest,
  GenerateContentRequestNonStreaming,
  GenerateContentRequestStreaming,
  GenerateContentResponse,
  StreamGenerateContentRequest,
} from '../types/gemini.js'

export class Gemini {
  constructor(private readonly client: HypersHubClient) {}

  generateContent(
    params: GenerateContentRequestStreaming,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<GenerateContentResponse>>
  generateContent(
    params: GenerateContentRequestNonStreaming,
    signal?: AbortSignal,
  ): Promise<GenerateContentResponse>
  async generateContent(
    params: GenerateContentRequest,
    signal?: AbortSignal,
  ): Promise<GenerateContentResponse | AsyncGenerator<GenerateContentResponse>> {
    const stream = (params as { stream?: boolean }).stream === true
    const { model, stream: _s, ...body } = params as unknown as Record<string, unknown>
    const action = stream ? 'streamGenerateContent' : 'generateContent'
    const response = await this.client._request({
      method: 'POST',
      path: `/v1beta/models/${encodeURIComponent(model as string)}:${action}`,
      body,
      signal,
    })
    if (stream) {
      return parseSSE<GenerateContentResponse>(response)
    }
    return response.json() as Promise<GenerateContentResponse>
  }

  streamGenerateContent(
    params: StreamGenerateContentRequest,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<GenerateContentResponse>>
  async streamGenerateContent(
    params: StreamGenerateContentRequest,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const { model, ...body } = params
    const response = await this.client._request({
      method: 'POST',
      path: `/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent`,
      body,
      signal,
    })
    return parseSSE<GenerateContentResponse>(response)
  }
}
