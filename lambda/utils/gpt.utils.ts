import { type OpenAIApi } from 'openai'
import { fetchLatestMessages } from './dynamoDb.utils'
import { delimiterProcessor, imageCooldownCheck } from './common.utils'

interface Record {
  body: string
}

interface Message {
  conversationId: string
  to: string
  from: string
  body: string
}

async function createChatCompletion (openai: OpenAIApi, messages: any[], model: string): Promise<string | undefined> {
  const response = await openai.createChatCompletion({
    model,
    messages,
    temperature: 1, // set to 0 to make deterministic
    max_tokens: 256,
    frequency_penalty: 0,
    presence_penalty: 0
  })
  return response.data.choices && response.data.choices[0]?.message?.content
}

export async function processRecord (
  record: Record,
  openai: OpenAIApi,
  conversationTableName: string,
  model: string,
  prompt: string
): Promise<{ conversationId: string, to: string, from: string, sqsMessage: string, imagePrompt: boolean, body: string }> {
  const { conversationId, to, from, body } = JSON.parse(record.body) as Message

  const messages = await fetchLatestMessages(from, conversationTableName, body, prompt, from, conversationId)
  console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history.`)
  console.log(`MESSAGES: ${JSON.stringify(messages)}`)

  const openAIResponse = await createChatCompletion(openai, messages, model)
  if (!openAIResponse) {
    throw new Error(`${conversationId} -- QueryGPT -- No response from OpenAI`)
  }
  console.log(`${conversationId} -- QueryGPT -- OpenAI Success.`)

  // Check if any of the last three assistant messages have a delimiter. If so, the image generation will be on cooldown.
  const imageOnCooldown = imageCooldownCheck(messages)
  let imagePrompt = openAIResponse.includes('<<<')
  let sqsMessage = openAIResponse
  if (imagePrompt && imageOnCooldown) {
    imagePrompt = false
    const { response } = delimiterProcessor(openAIResponse)
    sqsMessage = response
    console.log('Prompt detected, but image generation on cooldown.')
  }

  return { conversationId, to, from, sqsMessage, imagePrompt, body }
}
