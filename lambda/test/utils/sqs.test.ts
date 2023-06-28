import { SQS } from 'aws-sdk';
import { sendMessageToSqs, processMessage } from '../../utils/sqs.util';
import { createResponse } from '../../utils/common.utils';

jest.mock('aws-sdk', () => {
    return {
      SQS: jest.fn().mockImplementation(() => {
        return {
          sendMessage: jest.fn().mockImplementation((params) => {
            const messageBody = JSON.parse(params.MessageBody);
            const queueUrl = params.QueueUrl;
            if (messageBody.conversationId === '123' && queueUrl !== 'ErrorQueue') {
              return {
                promise: jest.fn().mockResolvedValue({}),
              };
            } else {
              return {
                promise: jest.fn().mockRejectedValue(new Error('Failed to send message')),
              };
            }
          }),
        };
      }),
    };
});

  

describe('sendMessageToSqs', () => {
  let sqs: { sendMessage: jest.Mock };
  let consoleError: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    sqs = new SQS() as any;
    consoleError = jest.spyOn(console, 'error').mockImplementation();
    consoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleLog.mockRestore();
  });

  it('should log a success message when message is sent successfully', async () => {
    await sendMessageToSqs({
      conversationId: '123',
      to: '+123456789',
      from: '+198765432',
      body: 'Test Body!'
    }, 'lambda', 'queueUrl');
    expect(consoleLog).toHaveBeenCalled();
  });

  it('should log an error and throw an error when there is an issue in sending a message to the SQS', async () => {
    const mockSQS = {
      sendMessage: jest.fn().mockReturnValue({
        promise: () => Promise.reject(new Error('SQS error'))
      })
    };
  
    jest.mock('aws-sdk', () => ({
      SQS: jest.fn(() => mockSQS)
    }));
  
    await expect(sendMessageToSqs({
      conversationId: 'failure',
      to: '+123456789',
      from: '+198765432',
      body: 'This is a test message'
    }, 'testLambda', 'testQueueUrl')).rejects.toThrow();
    jest.resetModules();
  });

});

describe('processMessage', () => {
  let sendMessageToSqsMock: jest.SpyInstance;

  beforeEach(() => {
    sendMessageToSqsMock = jest.spyOn({ sendMessageToSqs }, 'sendMessageToSqs').mockResolvedValue(undefined);
  });

  afterEach(() => {
    sendMessageToSqsMock.mockRestore();
  });

  it('should return a success response when message is processed successfully', async () => {
    const response = await processMessage({ conversationId: '123' }, 'queueUrl');
    expect(response).toEqual(createResponse(200, { message: 'Success! ConversationID: 123.' }));
  });

  it('should return an error response when there is an issue in processing the message', async () => {
    const response = await processMessage({ conversationId: '123' }, 'ErrorQueue');
    expect(response).toEqual(createResponse(500, { error: 'Failed to send message: Error: Failed to send message' }));
  });
  
});
