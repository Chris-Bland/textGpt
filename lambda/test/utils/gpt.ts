import { processRecord } from '../../utils/gpt.utils'
import { OpenAIApi } from 'openai'
import * as sqsUtils from '../../utils/sqs.util'
import * as dynamoDbUtils from '../../utils/dynamoDb.utils'

jest.mock('openai', () => {
  return {
    OpenAIApi: jest.fn().mockImplementation(() => {
      return { createChatCompletion: jest.fn() }
    })
  }
})

jest.mock('../../utils/sqs.util', () => ({
  sendMessageToSqs: jest.fn()
}))

jest.mock('../../utils/dynamoDb.utils', () => ({
  fetchLatestMessages: jest.fn(),
  storeInDynamoDB: jest.fn()
}))

describe('processRecord', () => {
  let mockOpenaiInstance: OpenAIApi

  beforeEach(() => {
    mockOpenaiInstance = new (OpenAIApi as any)({});
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockClear();

    (sqsUtils.sendMessageToSqs as jest.Mock).mockClear();
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockClear();
    (dynamoDbUtils.storeInDynamoDB as jest.Mock).mockClear()

    console.log = jest.fn()
    console.error = jest.fn()
  })

  it('should process record successfully', async () => {
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue({ data: { choices: [{ message: { content: 'response' } }] } });
    (sqsUtils.sendMessageToSqs as jest.Mock).mockResolvedValue(undefined);
    (dynamoDbUtils.storeInDynamoDB as jest.Mock).mockResolvedValue(undefined)

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')

    expect(console.log).toHaveBeenCalledWith('1 -- QueryGPT -- fetched dynamoDB history.')
    expect(console.log).toHaveBeenCalledWith('1 -- QueryGPT -- OpenAI Success.')
  })

  it('should handle chat completion error', async () => {
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue(new Error('Error in chat completion'))

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith("Error creating chat completion with OpenAI: Cannot read properties of undefined (reading 'choices')")
  })

  it('should handle SQS error', async () => {
    process.env.SEND_SMS_QUEUE_URL = 'testQueueUrl';
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue({ data: { choices: [{ message: { content: 'response' } }] } });
    (sqsUtils.sendMessageToSqs as jest.Mock).mockRejectedValue(new Error('Error in SQS'))

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith('Error sending message to SQS: Error in SQS')
  })

  it('should handle DynamoDB error', async () => {
    process.env.SEND_SMS_QUEUE_URL = 'testQueueUrl';
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue({ data: { choices: [{ message: { content: 'response' } }] } });
    (sqsUtils.sendMessageToSqs as jest.Mock).mockResolvedValue(undefined);
    (dynamoDbUtils.storeInDynamoDB as jest.Mock).mockRejectedValue(new Error('Error in DynamoDB'))

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith('Error storing conversation in DynamoDB: Error in DynamoDB')
  })

  it('should handle no response from OpenAI', async () => {
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue({ data: { choices: [] } })

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith("Error creating chat completion with OpenAI: Cannot read properties of undefined (reading 'message')")
  })

  it('should log an error other than ChatCompletionError in createChatCompletion', async () => {
    const fakeError = { message: 'fake error' }
    const consoleSpy = jest.spyOn(console, 'error');
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockRejectedValue(fakeError)

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(consoleSpy).toHaveBeenCalledWith('Error processing record: fake error')
  })

  it('should log an error other than SqsError in sendToSqs', async () => {
    const fakeError = { message: 'fake error' }
    const consoleSpy = jest.spyOn(console, 'error')
    process.env.SEND_SMS_QUEUE_URL = 'testQueueUrl';
    (sqsUtils.sendMessageToSqs as jest.Mock).mockRejectedValue(fakeError)

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(consoleSpy).toHaveBeenCalledWith("Error creating chat completion with OpenAI: Cannot read properties of undefined (reading 'data')")
  })

  it('should log an error other than DynamoDbError in storeConversationInDynamoDB', async () => {
    const fakeError = { message: 'fake error' }
    const consoleSpy = jest.spyOn(console, 'error');
    (dynamoDbUtils.storeInDynamoDB as jest.Mock).mockRejectedValue(fakeError)

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(consoleSpy).toHaveBeenCalledWith("Error creating chat completion with OpenAI: Cannot read properties of undefined (reading 'data')")
  })

  it('should handle unknown error type in processRecord', async () => {
    const fakeError = { message: 'fake error' };
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockRejectedValue(fakeError)

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith('Error processing record: fake error')
  })

  it('should handle null message content from OpenAI', async () => {
    (dynamoDbUtils.fetchLatestMessages as jest.Mock).mockResolvedValue([{ sender: 'user', content: 'hello' }]);
    (mockOpenaiInstance.createChatCompletion as jest.Mock).mockResolvedValue({ data: { choices: [{ message: null }] } })

    await processRecord({ body: JSON.stringify({ conversationId: '1', to: 'to', from: 'from', body: 'body' }) }, mockOpenaiInstance, 'conversationTable', 'test-model', 'test-prompt')
    expect(console.error).toHaveBeenCalledWith('1 -- QueryGPT -- No response from OpenAI')
  })
})
