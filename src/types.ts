export type LibrettoConfig = {
  apiKey?: string;
  promptTemplateName?: string;
  allowUnnamedPrompts?: boolean;
  redactPii?: boolean;
  chatId?: string;
  waitForEvent?: boolean;
};

/**
 * The public facing parameters that are used when making calls through APIs.
 * Using this type allows you to send events to Libretto.
 *
 * You should use the package specific types instead of this one directly.
 * For example, if you are using OpenAI, use @libretto/openai's exported type instead of this.
 */
export type CoreLibrettoCreateParams<TEMPLATE_CHAT = never> = {
  apiKey?: string;
  promptTemplateName?: string;
  templateParams?: Record<string, any>;
  // This can be overriden by more specific pacakges and expected format (e.g. OpenAI ChatCompletionMessage)
  templateChat?: TEMPLATE_CHAT extends never ? never : TEMPLATE_CHAT;
  chatId?: string;
  chainId?: string;
  feedbackKey?: string;
  context?: Record<string, any>;

  /** @deprecated Use chainId instead */
  parentEventId?: string;
};

/**
 * Each supported sdk from Libretto should be available here.
 */
export type LibrettoEventSource = "openai" | "anthropic" | "vercel-ai";

/**
 * Data used to mostly send to the send event call
 */
export interface CoreEventMetadata<
  MODEL_PARAMETERS = never,
  TOOL_CALLS = never,
  METRICS = never,
> {
  promptTemplateText?: string | null;
  promptTemplateTextId?: string;
  promptTemplateChat?: any[];
  promptTemplateName?: string;
  apiName?: string;
  apiKey?: string;
  chatId?: string;
  chainId?: string;
  feedbackKey?: string;
  context?: Record<string, any>;
  tools?: any[];
  params: Record<string, any>;
  /** Included after response */
  response?: string | null;
  /** Plain, raw result from API call */
  rawResponse?: any | null;
  /** Response time in ms */
  responseTime?: number;
  /** Included only if there is an error from the llm, or error in validation */
  responseErrors?: string[];
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  prompt: {}; // deprecated field
  // Override this accordingly
  modelParameters?: MODEL_PARAMETERS extends never ? never : MODEL_PARAMETERS;
  toolCalls?: TOOL_CALLS extends never ? never : TOOL_CALLS;
  responseMetrics?: METRICS extends never ? never : METRICS;
  source?: LibrettoEventSource;
}
