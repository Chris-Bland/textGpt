import { handler } from '../../queryGpt'
import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from '../../utils/secrets.util'
import { sendMessageToSqs } from '../../utils/sqs.util'

jest.mock('../../utils/secrets.util')
jest.mock('../../utils/openAi.utils')
jest.mock('../../utils/sqs.util')
jest.mock('openai')

const mockGetSecret = getSecret as jest.MockedFunction<typeof getSecret>
// const mockProcessRecord = processRecord as jest.MockedFunction<typeof processRecord>
const mockSendMessageToSqs = sendMessageToSqs as jest.MockedFunction<typeof sendMessageToSqs>

describe('queryGPT Lambda Function', () => {
  let originalErrorQueueUrl: string | undefined
  beforeEach(() => {
    originalErrorQueueUrl = process.env.ERROR_QUEUE_URL
    jest.resetAllMocks()
    process.env.CONVERSATION_TABLE_NAME = 'test-table-name'
    process.env.ERROR_QUEUE_URL = 'https://example.com/error_queue'
    process.env.MODEL = 'test-model'
  })

  afterEach(() => {
    process.env.ERROR_QUEUE_URL = originalErrorQueueUrl
  })

  it('should process records successfully', async () => {
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key', PROMPT: 'test-prompt' })
    mockProcessRecord.mockResolvedValue(undefined)

    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', message: 'Test message' } }] }

    await handler(event)

    expect(mockProcessRecord).toHaveBeenCalled()
  })

  it('should throw error when unable to retrieve OpenAI API Key from secrets', async () => {
    mockGetSecret.mockResolvedValue(null)

    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', message: 'Test message' } }] }

    await handler(event)

    expect(mockSendMessageToSqs).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: '123' }),
      'QueryGPT',
      process.env.ERROR_QUEUE_URL
    )
  })

  it('should throw an error message if ERROR_QUEUE_URL environment variable is not set', async () => {
    delete process.env.ERROR_QUEUE_URL

    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', message: 'Test message' } }] }

    await expect(handler(event)).rejects.toThrow('QueryGPT -- ERROR_QUEUE_URL is missing.')
  })

  it('should throw error when CONVERSATION_TABLE_NAME environment variable is missing', async () => {
    delete process.env.CONVERSATION_TABLE_NAME
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key' })

    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', message: 'Test message' } }] }

    await handler(event)

    expect(mockSendMessageToSqs).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: '123' }),
      'QueryGPT',
      process.env.ERROR_QUEUE_URL
    )
  })
})
