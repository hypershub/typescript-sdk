import { doRequest, type RequestOptions } from './lib/request.js'
import { Chat } from './resources/chat/index.js'
import { Messages } from './resources/messages.js'
import { Gemini } from './resources/gemini.js'
import { Responses } from './resources/responses.js'
import { Models } from './resources/models.js'

export interface HypersHubOptions {
  /** Your HypersHub API key (e.g. `sk-hy-...`). Defaults to `process.env.HYPERSHUB_API_KEY`. */
  apiKey?: string
  /** API base URL. Defaults to `https://hypershub.com`. */
  baseURL?: string
  /** Default headers sent with every request. */
  defaultHeaders?: Record<string, string>
  /** Request timeout in milliseconds. Default: no timeout (uses AbortSignal if provided). */
  timeout?: number
}

/** @internal – exposed so resource classes can call `_request` without depending on the concrete class */
export interface HypersHubClient {
  _request(options: RequestOptions): Promise<Response>
}

export class HypersHub implements HypersHubClient {
  readonly chat: Chat
  readonly responses: Responses
  readonly messages: Messages
  readonly gemini: Gemini
  readonly models: Models

  private readonly _apiKey: string
  private readonly _baseURL: string
  private readonly _defaultHeaders: Record<string, string>
  private readonly _timeout?: number

  constructor(options: HypersHubOptions = {}) {
    const apiKey =
      options.apiKey ??
      (typeof process !== 'undefined' ? process.env['HYPERSHUB_API_KEY'] : undefined)
    if (!apiKey) {
      throw new Error(
        'HypersHub API key is required. Pass `apiKey` to the constructor or set the `HYPERSHUB_API_KEY` environment variable.',
      )
    }
    this._apiKey = apiKey
    this._baseURL = (options.baseURL ?? 'https://hypershub.com').replace(/\/$/, '')
    this._defaultHeaders = options.defaultHeaders ?? {}
    this._timeout = options.timeout

    this.chat = new Chat(this)
    this.responses = new Responses(this)
    this.messages = new Messages(this)
    this.gemini = new Gemini(this)
    this.models = new Models(this)
  }

  /** @internal */
  _request(options: RequestOptions): Promise<Response> {
    return doRequest(this._baseURL, this._apiKey, options, this._defaultHeaders, this._timeout)
  }
}
