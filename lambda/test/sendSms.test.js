const AWS = require('aws-sdk-mock');
const lambda = require('../sendSms');
const twilio = require('twilio');
jest.mock('twilio');

describe('SendSMS', () => {
  let getSecretValueMock;
  let twilioClientMock;

  beforeEach(() => {
    getSecretValueMock = jest.fn();
    AWS.mock('SecretsManager', 'getSecretValue', getSecretValueMock);

    twilioClientMock = {
      messages: {
        create: jest.fn(),
      },
    };
    twilio.mockReturnValue(twilioClientMock);
  });

  afterEach(() => {
    AWS.restore('SecretsManager');
    twilio.mockRestore();
  });

  it('should send SMS for each record in the event', async () => {
    const secrets = {
      TWILIO_ACCOUNT_SID: 'test_sid',
      TWILIO_AUTH_TOKEN: 'test_auth_token',
    };
    getSecretValueMock.mockResolvedValue({
      SecretString: JSON.stringify(secrets),
    });

    const event = {
      Records: [
        { body: JSON.stringify(['+1234567890', '+0987654321', 'Test message']) },
      ],
    };

    await lambda.handler(event);

    expect(getSecretValueMock).toHaveBeenCalledWith({ SecretId: 'ChatGPTSecrets' });
    expect(twilioClientMock.messages.create).toHaveBeenCalledTimes(event.Records.length);
    expect(twilioClientMock.messages.create).toHaveBeenCalledWith({
      body: 'Test message    --TextGeePT',
      from: '+1234567890',
      to: '+0987654321',
    });
  });

});