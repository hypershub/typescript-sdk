import type { ChatMessage, Tool } from './chat.js'

// ─── Request ─────────────────────────────────────────────────────────────────

export interface ResponseCreateParamsBase {
  model: string
  input: string | ChatMessage[] | Array<Record<string, unknown>>
  instructions?: string
  max_output_tokens?: number
  reasoning_effort?: 'low' | 'medium' | 'high'
  temperature?: number
  tools?: Tool[] | Array<Record<string, unknown>>
  text?: {
    format?:
      | { type: 'text' | 'json_object' }
      | { type: 'json_schema'; json_schema: Record<string, unknown> }
  }
  previous_response_id?: string
}

export interface ResponseCreateParamsNonStreaming extends ResponseCreateParamsBase {
  stream?: false | null
}

export interface ResponseCreateParamsStreaming extends ResponseCreateParamsBase {
  stream: true
}

export type ResponseCreateParams =
  | ResponseCreateParamsNonStreaming
  | ResponseCreateParamsStreaming

// ─── Response ────────────────────────────────────────────────────────────────

export interface ResponseUsage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  input_tokens_details?: Record<string, unknown>
  output_tokens_details?: Record<string, unknown>
}

export interface ResponseOutputText {
  type: 'output_text'
  text: string
  annotations?: unknown[]
}

export interface ResponseOutputRefusal {
  type: 'refusal'
  refusal: string
}

export type ResponseOutputContent = ResponseOutputText | ResponseOutputRefusal

export interface ResponseOutputMessage {
  id?: string
  type: 'message'
  role: 'assistant'
  status?: string
  content: ResponseOutputContent[]
}

export type ResponseOutputItem = ResponseOutputMessage

export interface ModelResponse {
  id: string
  object: 'response'
  created_at?: number
  status: 'completed' | 'in_progress' | 'incomplete' | 'failed' | 'cancelled' | string
  model: string
  output: ResponseOutputItem[]
  usage?: ResponseUsage
}

// ─── Streaming Events ───────────────────────────────────────────────────────

export interface ResponseCreatedEvent {
  type: 'response.created'
  response: ModelResponse
}

export interface ResponseOutputTextDeltaEvent {
  type: 'response.output_text.delta'
  item_id?: string
  output_index?: number
  content_index?: number
  delta: string
}

export interface ResponseOutputTextDoneEvent {
  type: 'response.output_text.done'
  item_id?: string
  output_index?: number
  content_index?: number
  text: string
}

export interface ResponseCompletedEvent {
  type: 'response.completed'
  response: ModelResponse
}

export interface ResponseFailedEvent {
  type: 'response.failed'
  response: ModelResponse
}

export interface ResponseIncompleteEvent {
  type: 'response.incomplete'
  response: ModelResponse
}

export type ResponseStreamEvent =
  | ResponseCreatedEvent
  | ResponseOutputTextDeltaEvent
  | ResponseOutputTextDoneEvent
  | ResponseCompletedEvent
  | ResponseFailedEvent
  | ResponseIncompleteEvent
