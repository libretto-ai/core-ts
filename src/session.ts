import { RateLimiter } from "limiter";
import pLimit from "p-limit";
import { CoreEventMetadata } from "./types";

const logRateLimiters: Record<number, RateLimiter> = {
  429: new RateLimiter({
    tokensPerInterval: 1,
    interval: "second",
  }),
  499: new RateLimiter({
    tokensPerInterval: 1,
    interval: "second",
  }),
};

const SEND_EVENT_CONCURRENCY_LIMIT = 25;
const SEND_EVENT_MAX_PENDING = 1000;
const sendEventLimiter = pLimit(SEND_EVENT_CONCURRENCY_LIMIT);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_API_PREFIX = "https://app.getlibretto.com/api";

function getUrl(apiName: string, environmentName: string): string {
  if (process.env[environmentName]) {
    return process.env[environmentName]!;
  }

  const prefix = process.env.LIBRETTO_API_PREFIX ?? DEFAULT_API_PREFIX;
  return `${prefix}/${apiName}`;
}

/**
 * Send the event to Libretto, and handles rate limiting of various things.
 */
export async function sendEvent<EVENT extends CoreEventMetadata<any, any, any>>(
  event: EVENT,
) {
  if (!event.apiKey) {
    return;
  }
  if (event.chainId !== undefined && !UUID_REGEX.test(event.chainId)) {
    console.error(`[Libretto] chainId '${event.chainId}' is not a valid UUID`);
    return;
  }

  const url = getUrl("event", "LIBRETTO_REPORTING_URL");
  const body = JSON.stringify(event);
  let status = 0;

  try {
    if (sendEventLimiter.pendingCount >= SEND_EVENT_MAX_PENDING) {
      status = 429; // Simulate "Too Many Requests"
      throw new Error(`too many pending requests (${SEND_EVENT_MAX_PENDING})`);
    }

    const response = await sendEventLimiter(fetch, url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
    status = response.status;
    const responseJson = await extractJsonBody(response);
    if (!response.ok) {
      throw new Error(`Failed to send event: ${JSON.stringify(responseJson)}`);
    }

    return responseJson;
  } catch (e) {
    const emitLog = () => {
      console.error("Failed to send event to libretto:", e);
    };

    // Always log if LIBRETTO_DEBUG is on
    if (process.env.LIBRETTO_DEBUG === "true") {
      emitLog();
      return;
    }

    // Never log for non-client errors
    if (status < 400 || status >= 500) {
      return;
    }

    // Log unless we're over our limit for this status code
    const limiter = logRateLimiters[status];
    if (!limiter || limiter.tryRemoveTokens(1)) {
      emitLog();
      return;
    }
  }
}

async function extractJsonBody(response: Response) {
  const body = await response.text();
  try {
    return JSON.parse(body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    throw new Error(
      `Unparseable response (${response.status} ${response.statusText}): ${body}`,
    );
  }
}
