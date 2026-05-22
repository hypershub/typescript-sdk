import type { HypersHubClient } from '../../hypershub.js'
import { parseSSE } from '../../lib/streaming.js'
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from '../../types/chat.js'

export class Completions {
  constructor(private readonly client: HypersHubClient) {}

  create(
    params: ChatCompletionCreateParamsStreaming,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<ChatCompletionChunk>>
  create(
    params: ChatCompletionCreateParamsNonStreaming,
    signal?: AbortSignal,
  ): Promise<ChatCompletion>
  async create(
    params: ChatCompletionCreateParamsNonStreaming | ChatCompletionCreateParamsStreaming,
    signal?: AbortSignal,
  ): Promise<ChatCompletion | AsyncGenerator<ChatCompletionChunk>> {
    const response = await this.client._request({
      method: 'POST',
      path: '/v1/chat/completions',
      body: params,
      signal,
    })
    if (params.stream) {
      return parseSSE<ChatCompletionChunk>(response)
    }
    return response.json() as Promise<ChatCompletion>
  }
}
