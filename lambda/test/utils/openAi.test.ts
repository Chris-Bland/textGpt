import { processRecord } from '../../utils/openAi.utils';
import { fetchLatestMessages, storeInDynamoDB } from '../../utils/dynamoDb.utils';
import { sendMessageToSqs } from '../../utils/sqs.util';
import { OpenAIApi } from 'openai';

jest.mock('../../utils/dynamoDb.utils');
jest.mock('../../utils/sqs.util');
jest.mock('openai');

describe('OpenAI utility function - processRecord', () => {
  const openai = new OpenAIApi();
  const conversationTableName = 'exampleTable';
  const record = {
    body: JSON.stringify({
      conversationId: '123',
      to: '+1234567890',
      from: '+0987654321',
      body: 'Hello, how are you?',
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process record and send message to SQS if OpenAI responds', async () => {
    const mockMessages = [
      {
        content: 'Initial message',
        role: 'system',
      },
    ];

    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: 'A common, all-around greeting in Japanese is Konnichiwa which means Hello or Good afternoon.   --TextGPT',
            },
          },
        ],
      },
    };

    fetchLatestMessages.mockResolvedValue(mockMessages);
    openai.createChatCompletion.mockResolvedValue(mockResponse);
    sendMessageToSqs.mockResolvedValue({});
    storeInDynamoDB.mockResolvedValue({});

    await processRecord(record, openai, conversationTableName);

    expect(sendMessageToSqs).toHaveBeenCalledTimes(1);
    expect(storeInDynamoDB).toHaveBeenCalledTimes(1);
  });

  it('should log an error if OpenAI does not return a message', async () => {
    const mockMessages = [
      {
        content: 'Initial message',
        role: 'system',
      },
    ];

    const mockResponse = {
      data: {
        choices: [],
      },
    };

    fetchLatestMessages.mockResolvedValue(mockMessages);
    openai.createChatCompletion.mockResolvedValue(mockResponse);

    console.error = jest.fn();

    await processRecord(record, openai, conversationTableName);

    expect(console.error).toHaveBeenCalledWith(
      '123 -- QueryGPT -- No response from OpenAI'
    );
  });

  it('should handle errors from OpenAI API', async () => {
    const mockMessages = [
      {
        content: 'Initial message',
        role: 'system',
      },
    ];

    fetchLatestMessages.mockResolvedValue(mockMessages);
    openai.createChatCompletion.mockRejectedValue(new Error('API Error'));

    console.error = jest.fn();

    await processRecord(record, openai, conversationTableName);

    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should handle errors from fetching latest messages', async () => {
    fetchLatestMessages.mockRejectedValue(new Error('DynamoDB Error'));

    console.error = jest.fn();

    await processRecord(record, openai, conversationTableName);

    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
