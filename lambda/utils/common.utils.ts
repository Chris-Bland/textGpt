import { ChatCompletionRequestMessage } from "openai"

export const createResponse = (statusCode: number, body: any) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

export const delimiterProcessor = (input: string): { response: string, imagePrompt: string } => {
  const startDelimiter = '<<<'
  const endDelimiter = '>>>'
  const startIndex = input.indexOf(startDelimiter)
  const endIndex = input.indexOf(endDelimiter)

  if (startIndex !== -1 && endIndex !== -1) {
    console.log('Delimited Prompt Detected in Response')
    const response = input.slice(0, startIndex).trim()
    const imagePrompt = input.slice(startIndex + startDelimiter.length, endIndex).trim()
    return { response, imagePrompt }
  }

  return { response: input.trim(), imagePrompt: '' }
}

export const imageCooldownCheck = (messages: ChatCompletionRequestMessage[]) => {
  let imageOnCooldown = false;

  const assistantMessages = messages.filter(message => message.role === "assistant");

  // Check the last three assistant messages for the delimiter
  for (let i = assistantMessages.length - 1; i >= Math.max(assistantMessages.length - 3, 0); i--) {
      const currentMessage = assistantMessages[i];
      if (currentMessage && currentMessage.content && currentMessage.content.includes('<<<')) {
          imageOnCooldown = true;
          break;
      }
  }
  return imageOnCooldown;
}
