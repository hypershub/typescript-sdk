// ─── Content Blocks ───────────────────────────────────────────────────────────

export interface TextBlock {
  type: 'text'
  text: string
}

export interface ImageBlock {
  type: 'image'
  source:
    | { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string }
    | { type: 'url'; url: string }
}

export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string | TextBlock[]
  is_error?: boolean
}

export interface ThinkingBlock {
  type: 'thinking'
  thinking: string
}

export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock | ThinkingBlock

// ─── Messages ────────────────────────────────────────────────────────────────

export interface MessageParam {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

export interface AnthropicTool {
  name: string
  description?: string
  input_schema: { type: 'object'; properties?: Record<string, unknown>; required?: string[] }
}

// ─── Request ─────────────────────────────────────────────────────────────────

export interface MessageCreateParamsBase {
  model: string
  messages: MessageParam[]
  max_tokens: number
  system?: string | Array<{ type: 'text'; text: string }>
  tools?: AnthropicTool[]
  tool_choice?: { type: 'auto' | 'any' | 'none' } | { type: 'tool'; name: string }
  thinking?: { type: 'enabled'; budget_tokens: number }
  temperature?: number
  top_p?: number
  top_k?: number
  stop_sequences?: string[]
  metadata?: { user_id?: string }
}

export interface MessageCreateParamsNonStreaming extends MessageCreateParamsBase {
  stream?: false | null
}

export interface MessageCreateParamsStreaming extends MessageCreateParamsBase {
  stream: true
}

export type MessageCreateParams = MessageCreateParamsNonStreaming | MessageCreateParamsStreaming

// ─── Response ────────────────────────────────────────────────────────────────

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null

export interface MessageUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export interface Message {
  id: string
  type: 'message'
  role: 'assistant'
  content: ContentBlock[]
  model: string
  stop_reason: StopReason
  stop_sequence: string | null
  usage: MessageUsage
}

// ─── Streaming Events ─────────────────────────────────────────────────────────

export interface MessageStartEvent {
  type: 'message_start'
  message: Message
}

export interface ContentBlockStartEvent {
  type: 'content_block_start'
  index: number
  content_block: TextBlock | ToolUseBlock | ThinkingBlock
}

export interface ContentBlockDeltaEvent {
  type: 'content_block_delta'
  index: number
  delta:
    | { type: 'text_delta'; text: string }
    | { type: 'input_json_delta'; partial_json: string }
    | { type: 'thinking_delta'; thinking: string }
}

export interface ContentBlockStopEvent {
  type: 'content_block_stop'
  index: number
}

export interface MessageDeltaEvent {
  type: 'message_delta'
  delta: { stop_reason: StopReason; stop_sequence: string | null }
  usage: { output_tokens: number }
}

export interface MessageStopEvent {
  type: 'message_stop'
}

export interface PingEvent {
  type: 'ping'
}

export type MessageStreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | PingEvent
