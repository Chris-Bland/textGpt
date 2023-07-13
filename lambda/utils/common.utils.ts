import { type ChatCompletionRequestMessage } from 'openai'

export const createResponse = (statusCode: number, body: any) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

export const delimiterProcessor = (input: string, startDelimiter: string, endDelimiter: string): { response: string, imagePrompt: string } => {
  const startIndex = input.indexOf(startDelimiter)
  const endIndex = input.indexOf(endDelimiter)
  // Checking to see if the startIndex and endIndex both exist in the openAiResponse from GPT
  if (startIndex !== -1 && endIndex !== -1) {
    console.log('Delimited Prompt Detected in Response')
    // If so, slice the response and prompt, and return
    const response = input.slice(0, startIndex).trim()
    const imagePrompt = input.slice(startIndex + startDelimiter.length, endIndex).trim()
    return { response, imagePrompt }
  }
  // If both indexes are not present, there is no delimited imagePrompt in the response, return an empty string
  return { response: input.trim(), imagePrompt: '' }
}

export const imageCooldownCheck = (messages: ChatCompletionRequestMessage[], startDelimiter: string, imageCooldownString: string) => {
  // To prevent the AI from sending an image every text, the image send has a cooldown.
  let imageOnCooldown = false
  // Filter out only the assistant message roles. These are the responses from GPT, rather than user or system.
  const assistantMessages = messages.filter(message => message.role === 'assistant')
  const imageCooldown = parseInt(imageCooldownString)
  // Iterate backwards through the assistantMessages array. The iteration starts from the last element
  // and goes up to the 'imageCooldown' number of elements from the end or up to the beginning of the array, whichever is larger.
  for (let i = assistantMessages.length - 1; i >= Math.max(assistantMessages.length - imageCooldown, 0); i--) {
    const currentMessage = assistantMessages[i]
    // Check if the current message and its content exist and if the content includes the startDelimiter.
    if (currentMessage && currentMessage.content && currentMessage.content.includes(startDelimiter)) {
      // If so, the image is on cooldown, set the bool to true, and break out of the loop
      console.log('Delimiter detected')
      imageOnCooldown = true
      break
    }
  }
  console.log(`Image Cooldown Check -- ${imageOnCooldown}`)
  return imageOnCooldown
}
