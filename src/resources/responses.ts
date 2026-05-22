import type { HypersHubClient } from '../hypershub.js'
import { parseSSE } from '../lib/streaming.js'
import type {
  ModelResponse,
  ResponseCreateParams,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from '../types/responses.js'

export class Responses {
  constructor(private readonly client: HypersHubClient) {}

  create(
    params: ResponseCreateParamsStreaming,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<ResponseStreamEvent>>
  create(params: ResponseCreateParamsNonStreaming, signal?: AbortSignal): Promise<ModelResponse>
  async create(
    params: ResponseCreateParams,
    signal?: AbortSignal,
  ): Promise<ModelResponse | AsyncGenerator<ResponseStreamEvent>> {
    const response = await this.client._request({
      method: 'POST',
      path: '/v1/responses',
      body: params,
      signal,
    })
    if (params.stream) {
      return parseSSE<ResponseStreamEvent>(response)
    }
    return response.json() as Promise<ModelResponse>
  }
}
