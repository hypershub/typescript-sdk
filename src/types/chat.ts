// ─── Content Parts ───────────────────────────────────────────────────────────

export interface TextContentPart {
  type: 'text'
  text: string
}

export interface ImageUrlContentPart {
  type: 'image_url'
  image_url: { url: string; detail?: 'auto' | 'low' | 'high' }
}

export type ContentPart = TextContentPart | ImageUrlContentPart

// ─── Tool Definitions ────────────────────────────────────────────────────────

export interface FunctionDefinition {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export interface Tool {
  type: 'function'
  function: FunctionDefinition
}

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface SystemMessage {
  role: 'system'
  content: string | ContentPart[]
  name?: string
}

export interface DeveloperMessage {
  role: 'developer'
  content: string | ContentPart[]
  name?: string
}

export interface UserMessage {
  role: 'user'
  content: string | ContentPart[]
  name?: string
}

export interface AssistantMessage {
  role: 'assistant'
  content?: string | null
  name?: string
  tool_calls?: ToolCall[]
}

export interface ToolMessage {
  role: 'tool'
  content: string
  tool_call_id: string
}

export type ChatMessage =
  | SystemMessage
  | DeveloperMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage

// ─── Request ─────────────────────────────────────────────────────────────────

export interface ChatCompletionRequestBase {
  model: string
  messages: ChatMessage[]
  tools?: Tool[]
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } }
  reasoning_effort?: 'low' | 'medium' | 'high'
  temperature?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  max_completion_tokens?: number
  max_tokens?: number
  response_format?: { type: 'text' | 'json_object' }
  stop?: string | string[]
  user?: string
}

export interface ChatCompletionCreateParamsNonStreaming extends ChatCompletionRequestBase {
  stream?: false | null
}

export interface ChatCompletionCreateParamsStreaming extends ChatCompletionRequestBase {
  stream: true
}

export type ChatCompletionCreateParams =
  | ChatCompletionCreateParamsNonStreaming
  | ChatCompletionCreateParamsStreaming

// ─── Response ────────────────────────────────────────────────────────────────

export interface ChatCompletionMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: ToolCall[]
}

export interface ChatCompletionChoice {
  index: number
  message: ChatCompletionMessage
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
}

export interface CompletionUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatCompletion {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage?: CompletionUsage
}

// ─── Streaming Response ───────────────────────────────────────────────────────

export interface ChoiceDelta {
  role?: 'assistant'
  content?: string | null
  tool_calls?: {
    index: number
    id?: string
    type?: 'function'
    function?: { name?: string; arguments?: string }
  }[]
}

export interface ChatCompletionChunkChoice {
  index: number
  delta: ChoiceDelta
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
}

export interface ChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: ChatCompletionChunkChoice[]
  usage?: CompletionUsage
}
