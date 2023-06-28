import { SQS } from 'aws-sdk';
import { sendMessageToSqs, processMessage } from '../../utils/sqs.util';
import { createResponse } from '../../utils/common.utils';

jest.mock('aws-sdk', () => {
  return {
    SQS: jest.fn().mockImplementation(() => {
      return {
        sendMessage: jest.fn().mockImplementation(() => {
          return {
            promise: jest.fn() // Just set this as jest.fn() initially
          };
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
    // Default mock implementation of promise (can be overridden in individual tests)
    sqs.sendMessage().promise.mockImplementation(() => Promise.resolve({}));
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleLog.mockRestore();
  });

  // ... other tests ...

  it('should log an error and throw an error when there is an issue in sending a message to the SQS', async () => {
    sqs.sendMessage().promise.mockImplementationOnce(() => Promise.reject(new Error('SQS error'))); // Override for this one call
    await expect(sendMessageToSqs({
      conversationId: '123',
      to: '+123456789',
      from: '+198765432',
      body: 'Test Body!'
    }, 'lambda', 'queueUrl')).rejects.toThrow('SQS error');
    expect(consoleError).toHaveBeenCalled();
  });
});

// ... rest of the file ...
