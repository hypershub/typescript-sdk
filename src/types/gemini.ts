// ─── Parts ───────────────────────────────────────────────────────────────────

export interface TextPart {
  text: string
}

export interface InlineDataPart {
  inline_data: { mime_type: string; data: string }
}

export interface FunctionCallPart {
  function_call: { name: string; args: Record<string, unknown> }
}

export interface FunctionResponsePart {
  function_response: { name: string; response: Record<string, unknown> }
}

export type Part = TextPart | InlineDataPart | FunctionCallPart | FunctionResponsePart

// ─── Content ─────────────────────────────────────────────────────────────────

export interface Content {
  role?: 'user' | 'model'
  parts: Part[]
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

export interface GeminiFunctionDeclaration {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export interface GeminiTool {
  function_declarations?: GeminiFunctionDeclaration[]
}

// ─── Generation Config ────────────────────────────────────────────────────────

export interface GenerationConfig {
  temperature?: number
  topP?: number
  topK?: number
  maxOutputTokens?: number
  stopSequences?: string[]
  responseMimeType?: string
  candidateCount?: number
  thinkingConfig?: { thinkingBudget?: number }
}

// ─── Request ─────────────────────────────────────────────────────────────────

export interface GenerateContentRequestBase {
  model: string
  contents: Content[]
  systemInstruction?: Content
  tools?: GeminiTool[]
  generationConfig?: GenerationConfig
}

export interface GenerateContentRequestNonStreaming extends GenerateContentRequestBase {
  stream?: false | null
}

export interface GenerateContentRequestStreaming extends GenerateContentRequestBase {
  stream: true
}

export type GenerateContentRequest =
  | GenerateContentRequestNonStreaming
  | GenerateContentRequestStreaming

export type StreamGenerateContentRequest = Omit<GenerateContentRequestBase, 'stream'>

// ─── Response ────────────────────────────────────────────────────────────────

export interface GeminiCandidate {
  content: Content
  finishReason?: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER'
  index?: number
  safetyRatings?: Array<{ category: string; probability: string }>
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
}

export interface GenerateContentResponse {
  candidates: GeminiCandidate[]
  usageMetadata?: GeminiUsageMetadata
  modelVersion?: string
}
