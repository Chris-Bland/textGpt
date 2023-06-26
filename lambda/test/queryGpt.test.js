const AWS = require('aws-sdk')
const openai = require('openai')
const queryGpt = require('../queryGpt.js')
AWS.config.update({ region: 'us-east-1' })

jest.mock('aws-sdk', () => {
  return {
    SQS: jest.fn(() => ({
      sendMessage: jest.fn().mockReturnThis(),
      promise: jest.fn()
    })),
    SecretsManager: jest.fn(() => ({
      getSecretValue: jest.fn().mockReturnThis(),
      promise: jest.fn()
    }))
  }
})

jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => ({
    createCompletion: jest.fn().mockReturnThis(),
    promise: jest.fn()
  }))
}))

describe('queryGpt', () => {
  let event

  beforeEach(() => {
    event = {
      Records: [
        {
          body: JSON.stringify({
            to: '+1234567890',
            from: '+0987654321',
            body: 'Hello'
          })
        }
      ]
    }
    AWS.SecretsManager().promise.mockResolvedValue({
      SecretString: JSON.stringify({ OPENAI_API_KEY: 'openai_test_key' })
    })
    openai.OpenAIApi().promise.mockResolvedValue({
      data: {
        choices: [
          {
            text: 'Test response'
          }
        ]
      }
    })
  })

  test('it processes a well-formed record correctly and sends to SQS', async () => {
    AWS.SQS().promise.mockResolvedValue()

    const result = await queryGpt.handler(event)

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).message).toEqual('Successfully put message on queue:  {"to":"+1234567890","from":"+0987654321","body":"Hello"}')
    expect(AWS.SQS().sendMessage).toHaveBeenCalledWith({
      MessageBody: JSON.stringify('+1234567890|||+0987654321|||Test response'),
      QueueUrl: process.env.SEND_SMS_QUEUE_URL
    })
  })

  test('it handles errors gracefully when sending to SQS fails', async () => {
    AWS.SQS().promise.mockRejectedValue(new Error('SQS Error'))

    const result = await queryGpt.handler(event)

    expect(result.statusCode).toBe(500)
  })

  test('it handles errors gracefully when getting secret fails', async () => {
    AWS.SecretsManager().promise.mockRejectedValue(new Error('Secrets Manager Error'))

    const result = await queryGpt.handler(event)

    expect(result.statusCode).toBe(500)
  })

  test('it handles errors gracefully when creating openai completion fails', async () => {
    openai.OpenAIApi().promise.mockRejectedValue(new Error('OpenAI Error'))

    const result = await queryGpt.handler(event)

    expect(result.statusCode).toBe(500)
  })
})
