import { formatTemplate, getTemplate, isObjectTemplate } from "./template";

export function getResolvedMessages(
  // TODO: this needed to be an any array
  messages: any,
  params?: Record<string, any>,
) {
  if (isObjectTemplate(messages)) {
    if (!params) {
      throw new Error(`Template requires params, but none were provided`);
    }
    const resolvedMessages = formatTemplate(messages, params);
    return { messages: resolvedMessages, template: getTemplate(messages) };
  }
  return { messages, template: null };
}
