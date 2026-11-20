// The product's configuration, shared by the Worker and the app. Most
// customisation happens here: the name, the assistant's instructions, which
// models people may pick, and the usage limits that protect the API credits.

export const BRAND = 'AI Chatbot'
export const TAGLINE = 'A general-purpose assistant for questions, writing and code.'

/** What the assistant is told before every conversation. */
export const SYSTEM_PROMPT = `You are ${BRAND}, a general-purpose assistant. Be clear and direct. Match the length of your answer to the question: a sentence or two for simple ones, headings and lists for complex ones. Use Markdown when it helps (lists, tables, code blocks with a language tag), never for decoration. Written code should be runnable and minimal; explain only what is not obvious. If you do not know something or are unsure, say so rather than guessing.`

/**
 * Models people may choose, in picker order. Ids are Freebuff API model ids
 * (GET https://freebuff.com/api/v1/paid/models lists them). The Worker refuses
 * any model not in this list, so this is also the spending allowlist.
 */
export const MODELS = [
  { id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', description: 'Fast, for everyday questions' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', description: 'Careful writing and analysis' },
  { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol', description: 'Broad knowledge' },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon', description: 'Long documents' },
] as const
export type ModelId = (typeof MODELS)[number]['id']
export const DEFAULT_MODEL: ModelId = 'deepseek-v4.1-flash'

/** Per-user limits. Messages are counted per UTC day. */
export const DAILY_MESSAGE_LIMIT = 50
/** How much history goes to the model with each message. */
export const MAX_CONTEXT_MESSAGES = 24
export const MAX_MESSAGE_CHARS = 8_000
export const MAX_OUTPUT_TOKENS = 2_048

/** Shown on an empty chat. */
export const SUGGESTIONS = [
  'Explain how compound interest works with a quick example',
  'Draft a polite follow-up email about a late invoice',
  'Write a SQL query that finds my ten most recent orders',
  'What should I know before adopting a cat?',
]

/** The Freebuff API, unless OPENAI_BASE_URL says otherwise. */
export const FREEBUFF_API_URL = 'https://freebuff.com/api/v1/paid'
/** Where the app's owner creates and funds an API key. */
export const FREEBUFF_API_KEYS_URL = 'https://freebuff.com/account/api'
