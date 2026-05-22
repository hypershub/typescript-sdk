import type { HypersHubClient } from '../hypershub.js'
import { parseSSE } from '../lib/streaming.js'
import type {
  Message,
  MessageCreateParamsNonStreaming,
  MessageCreateParamsStreaming,
  MessageStreamEvent,
} from '../types/messages.js'

export class Messages {
  constructor(private readonly client: HypersHubClient) {}

  create(
    params: MessageCreateParamsStreaming,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<MessageStreamEvent>>
  create(params: MessageCreateParamsNonStreaming, signal?: AbortSignal): Promise<Message>
  async create(
    params: MessageCreateParamsNonStreaming | MessageCreateParamsStreaming,
    signal?: AbortSignal,
  ): Promise<Message | AsyncGenerator<MessageStreamEvent>> {
    const response = await this.client._request({
      method: 'POST',
      path: '/v1/messages',
      body: params,
      headers: { 'anthropic-version': '2023-06-01' },
      signal,
    })
    if (params.stream) {
      return parseSSE<MessageStreamEvent>(response)
    }
    return response.json() as Promise<Message>
  }
}
