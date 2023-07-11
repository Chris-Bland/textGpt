import { type OpenAIApi } from 'openai'

export async function createChatCompletion (openai: OpenAIApi, messages: any[], model: string): Promise<string | undefined> {
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
