import { createChatCompletion } from '../../utils/gpt.utils'
import { OpenAIApi } from 'openai'

jest.mock('openai')

describe('createChatCompletion', () => {
  it('returns the expected completion', async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: 'Generated completion'
            }
          }
        ]
      }
    };

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValueOnce(mockResponse)

    const openai = new OpenAIApi()
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the weather like today?' }
    ]
    const model = 'gpt-3.5-turbo'

    const result = await createChatCompletion(openai, messages, model)

    expect(result).toBe('Generated completion')
    expect(OpenAIApi.prototype.createChatCompletion).toHaveBeenCalledWith({
      model,
      messages,
      temperature: 1,
      max_tokens: 256,
      frequency_penalty: 0,
      presence_penalty: 0
    })
  })
})
