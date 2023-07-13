import { handler } from '../../sendSms'
import { getSecret } from '../../utils/secrets.util'

jest.mock('../../utils/secrets.util')

const messageCreateMock = jest.fn().mockResolvedValue({ sid: 'mockedSid' });

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: messageCreateMock,
      },
    };
  });
});

const mockGetSecret = getSecret as jest.MockedFunction<typeof getSecret>


describe('sendSms Lambda Function', () => {
  beforeEach(() => {
    process.env.TEST_FROM_NUMBER = 'TEST123'
    process.env.ERROR_MESSAGE = 'error message'
    process.env.ERROR_QUEUE_ARN = 'arn:aws:sqs:us-east-1:123456789012:MyQueue'
  
    // Mock getSecret function to return valid Twilio credentials
    mockGetSecret.mockResolvedValue({
      TWILIO_ACCOUNT_SID: 'mockedAccountSID',
      TWILIO_AUTH_TOKEN: 'mockedAuthToken'
    })
  
    messageCreateMock.mockClear()
})

  it('should send SMS successfully', async () => {
    const event = {
      "Records": [
          {
              "messageId": "57fb4982-328f-47be-a814-1abecb3eab09",
              "receiptHandle": "AQEBRw+DNyztKhjzBILeQShDZv2otHdJPdBBWIvAcvTH1pspNkBQuSPV6MmskLMwhNFMZhjpWlnJcRF8q5Fq52raDvVPbDFNoUbi7dBOkGAvAxBnAR+L9Xta2hW7k40EIJFowTTOa8XZuLkssamogtEjWibwfI1kpyi7v5Qk5klcJldO5Rkq2BmmLRhj1Qhi54jhNyzBbDP4pmvKmqF8zfB6W+vVHbUA01s21jahcd01JAnNd6FLiWWSofY7q9MwCUqKyD+ARUWAaugFhzSiQIwe5NacNE1haOjqZIFVQ7jp8onoNvA5wagOaXQdwF20PC/WtzZYLBs7mpktvrdWBf2QHLtlzVQQRHaU42LolMinBXDRumaZGMyuPTnmtm/GD1xExyi9lfmij/WTNdVmyEDutiWt+gBDk04o0+vAGFOVChnaHM1YbVCYmh0uRRt71iey",
              "body": "{\"conversationId\":\"SM34dfcdadb698c99a1aa07ac9e1f90bce\",\"to\":\"+18449612720\",\"from\":\"+18436405233\",\"body\":\"test message\",\"lambda\":\"QueryGPT\"}",
              "attributes": {
                  "ApproximateReceiveCount": "1",
                  "AWSTraceHeader": "Root=1-64adad7a-f102b181334abcd150efe404;Parent=5784f3be47e19a03;Sampled=0;Lineage=8c251606:0|b1863677:0",
                  "SentTimestamp": "1689103742828",
                  "SenderId": "AROA53Q7L3VRTCA3ZACE2:TextGptStack-QueryGptHandler3DB68B2B-Ey35dFDVF4NC",
                  "ApproximateFirstReceiveTimestamp": "1689103742839"
              },
              "messageAttributes": {},
              "md5OfBody": "010d239c1a27a2b25e4ad7783ab29709",
              "eventSource": "aws:sqs",
              "eventSourceARN": "arn:aws:sqs:us-east-1:952474787171:TextGptStack-SendSmsQueueB4EC6D0B-w99WaAiZTveW",
              "awsRegion": "us-east-1"
          }
      ]
  }
    const response = await handler(event)

    expect(messageCreateMock).toHaveBeenCalledWith({
      from: '+18449612720',
      to: '+18436405233',
      body: 'test message',
    })
    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'SMS message sent successfully' })
    })
  })

  it('should not send message when body does not exist', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            conversationId: 'conv1',
            to: '0987654321',
            from: '1234567890',
            body: ''
          }),
        },
      ],
    }

    const response = await handler(event)

    expect(messageCreateMock).not.toHaveBeenCalled()
    expect(response).toEqual({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No Records Found' })
    })
  })

  it('should send message as MMS when imageUrl exists', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            conversationId: 'conv1',
            to: '0987654321',
            from: '1234567890',
            body: 'Test message with image',
            imageUrl: 'https://example.com/image.jpg'
          }),
        },
      ],
    }

    const response = await handler(event)

    expect(messageCreateMock).toHaveBeenCalledWith({
      from: '0987654321',
      to: '1234567890',
      body: 'Test message with image',
      mediaUrl: 'https://example.com/image.jpg'
    })
    expect(response.statusCode).toEqual(200)
  })

  it('should log test success and return 200 for TEST_FROM_NUMBER', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            conversationId: 'conv1',
            to: process.env.TEST_FROM_NUMBER,
            from: '0987654321',
            body: 'Test message'
          }),
        },
      ],
    }

    const response = await handler(event)

    expect(messageCreateMock).not.toHaveBeenCalled()
    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test Successful!' })
    })
  })

  it('should log error and send error SMS for ERROR_QUEUE_ARN', async () => {
    const event = {
      Records: [
        {
          eventSourceARN: process.env.ERROR_QUEUE_ARN,
          body: JSON.stringify({
            conversationId: 'conv1',
            to: '0987654321',
            from: '1234567890',
            lambda: 'errorLambda'
          }),
        },
      ],
    }

    const response = await handler(event)

    expect(messageCreateMock).toHaveBeenCalledWith({
      from: '0987654321',
      to: '1234567890',
      body: process.env.ERROR_MESSAGE,
      mediaUrl: undefined
    })
    expect(response.statusCode).toEqual(200)
  })


  it('should return 404 when no records are found', async () => {
    const event = {
      Records: [],
    }

    const response = await handler(event)

    expect(response).toEqual({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No Records Found' })
    })
  })

  afterEach(() => {
    jest.clearAllMocks();
  })
})
