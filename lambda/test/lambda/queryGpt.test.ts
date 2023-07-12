import { handler } from '../../queryGpt'
import { createChatCompletion } from '../../utils/gpt.utils'
import { fetchLatestMessages } from '../../utils/dynamoDb.utils'
import { imageCooldownCheck, delimiterProcessor } from '../../utils/common.utils'
import { storeInDynamoDB } from '../../utils/dynamoDb.utils'
import { sendMessageToSqs } from '../../utils/sqs.util'
import { getSecret } from '../../utils/secrets.util'

jest.mock('../../utils/gpt.utils')
jest.mock('../../utils/dynamoDb.utils')
jest.mock('../../utils/common.utils')
jest.mock('../../utils/sqs.util')
jest.mock('../../utils/secrets.util')

const mockGetSecret = getSecret as jest.MockedFunction<typeof getSecret>
const mockCreateChatCompletion = createChatCompletion as jest.MockedFunction<typeof createChatCompletion>
const mockFetchLatestMessages = fetchLatestMessages as jest.MockedFunction<typeof fetchLatestMessages>
const mockImageCooldownCheck = imageCooldownCheck as jest.MockedFunction<typeof imageCooldownCheck>
const mockDelimiterProcessor = delimiterProcessor as jest.MockedFunction<typeof delimiterProcessor>
const mockStoreInDynamoDB = storeInDynamoDB as jest.MockedFunction<typeof storeInDynamoDB>
const mockSendMessageToSqs = sendMessageToSqs as jest.MockedFunction<typeof sendMessageToSqs>

describe('queryGPT Lambda Function', () => {
  let originalErrorQueueUrl: string | undefined
  beforeEach(() => {
    originalErrorQueueUrl = process.env.ERROR_QUEUE_URL
    jest.resetAllMocks()
    process.env.CONVERSATION_TABLE_NAME = 'test-table-name'
    process.env.ERROR_QUEUE_URL = 'https://example.com/error_queue'
    process.env.MODEL = 'test-model'
    process.env.START_DELIMITER = '<<<'
    process.env.END_DELIMITER = '>>>'
    process.env.IMAGE_PROCESSOR_QUEUE_URL = 'https://example.com/image_processor_queue'
    process.env.SEND_SMS_QUEUE_URL = 'https://example.com/send_sms_queue'
    process.env.IMAGE_COOLDOWN = '3'
  })

  afterEach(() => {
    process.env.ERROR_QUEUE_URL = originalErrorQueueUrl
  })

  it('should process records successfully without image prompt', async () => {
    const event = { Records: [{ body: JSON.stringify({ conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' }) }] }
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key', PROMPT: 'test-prompt' })
    mockFetchLatestMessages.mockResolvedValue([{role: 'system', content: 'test-prompt'}, {role: 'user', content: 'Test message'}])
    mockCreateChatCompletion.mockResolvedValue('Test response')
    
    // Mock the sendMessageToSqs function to return a resolved Promise 
    mockSendMessageToSqs.mockResolvedValue(Promise.resolve())
  
    await handler(event)
  
    expect(mockFetchLatestMessages).toHaveBeenCalled()
    expect(mockCreateChatCompletion).toHaveBeenCalled()
    expect(mockSendMessageToSqs).toHaveBeenCalled()
    expect(mockStoreInDynamoDB).toHaveBeenCalled()
  })
  it('should process records successfully with image prompt', async () => {
    const event = { Records: [{ body: JSON.stringify({ conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' }) }] }
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key', PROMPT: 'test-prompt' })
    mockFetchLatestMessages.mockResolvedValue([{role: 'system', content: 'test-prompt'}, {role: 'user', content: 'Test message'}])
    mockCreateChatCompletion.mockResolvedValue('Test response <<<test>>>')
    mockDelimiterProcessor.mockReturnValue({ response: 'Test response without prompt', imagePrompt: '' })
    mockStoreInDynamoDB.mockResolvedValue(undefined)
    
    mockSendMessageToSqs.mockResolvedValue(Promise.resolve())
  
    await handler(event)
  
    expect(mockFetchLatestMessages).toHaveBeenCalled()
    expect(mockCreateChatCompletion).toHaveBeenCalled()
    expect(mockDelimiterProcessor).toHaveBeenCalled()
    expect(mockImageCooldownCheck).toHaveBeenCalled()
    expect(mockSendMessageToSqs).toHaveBeenCalled()
    expect(mockStoreInDynamoDB).toHaveBeenCalled()
  })
  
  it('should handle image cooldown', async () => {
    const event = { Records: [{ body: JSON.stringify({ conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' }) }] }
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key', PROMPT: 'test-prompt' })
    mockFetchLatestMessages.mockResolvedValue([{role: 'system', content: 'test-prompt'}, {role: 'user', content: 'Test message'},  {role: 'assistant', content: 'Test message<<<test>>>'}])
    mockCreateChatCompletion.mockResolvedValue('Test response<<<test image prompt>>>')
    mockDelimiterProcessor.mockReturnValue({ response: 'Test response', imagePrompt: 'test image prompt' })
    mockStoreInDynamoDB.mockResolvedValue(undefined)
    
    // Mock the sendMessageToSqs function to return a resolved Promise 
    mockSendMessageToSqs.mockResolvedValue(Promise.resolve())
  
    await handler(event)
  
    expect(mockFetchLatestMessages).toHaveBeenCalled()
    expect(mockCreateChatCompletion).toHaveBeenCalled()
    expect(mockDelimiterProcessor).toHaveBeenCalled()
    expect(mockImageCooldownCheck).toHaveBeenCalled()
    expect(mockSendMessageToSqs).toHaveBeenCalled()
    expect(mockStoreInDynamoDB).toHaveBeenCalled()
  })
  
  it('should throw error when unable to retrieve OpenAI API Key from secrets', async () => {
    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' } }] }
    mockGetSecret.mockResolvedValue(null)
    mockSendMessageToSqs.mockImplementation(() => { throw new Error() })
    
    try {
      await handler(event)
    } catch(e) {
      expect(mockSendMessageToSqs).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: '123' }),
        'QueryGPT',
        process.env.ERROR_QUEUE_URL
      )
    }
  })
  

  it('should throw an error message if ERROR_QUEUE_URL environment variable is not set', async () => {
    delete process.env.ERROR_QUEUE_URL
    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' } }] }
    const consoleSpy = jest.spyOn(console, 'error')
    await handler(event)
    expect(consoleSpy).toHaveBeenCalledWith('QueryGPT -- ERROR Queue Url variable missing.')
    consoleSpy.mockRestore()
  })
  

  it('should throw error when CONVERSATION_TABLE_NAME environment variable is missing', async () => {
    delete process.env.CONVERSATION_TABLE_NAME
    mockGetSecret.mockResolvedValue({ OPENAI_API_KEY: 'test-api-key' })

    const event = { Records: [{ body: { conversationId: '123', to: '1234567890', from: '0987654321', body: 'Test message' } }] }

    await handler(event)

    expect(mockSendMessageToSqs).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: '123' }),
      'QueryGPT',
      process.env.ERROR_QUEUE_URL
    )
  })
})
