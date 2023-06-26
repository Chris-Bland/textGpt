const AWS = require('aws-sdk')
const receiveSms = require('../receiveSms')
AWS.config.update({ region: 'us-east-1' })

jest.mock('aws-sdk', () => {
  return {
    SQS: jest.fn(() => ({
      sendMessage: jest.fn().mockReturnThis(),
      promise: jest.fn()
    }))
  }
})

describe('receiveSms', () => {
  let event

  beforeEach(() => {
    event = {
      body: 'Body=Hello&To=+1234567890&From=+0987654321'
    }
  })

  test('it parses a well-formed SMS correctly and sends to SQS', async () => {
    // Set up the mock SQS sendMessage function to resolve successfully
    AWS.SQS().promise.mockResolvedValue()

    const result = await receiveSms.handler(event)

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).message).toEqual('Successfully put message on queue:  "Body=Hello&To=+1234567890&From=+0987654321"')
    expect(AWS.SQS().sendMessage).toHaveBeenCalledWith({
      MessageBody: JSON.stringify({ body: 'Hello', to: '+1234567890', from: '+0987654321' }),
      QueueUrl: process.env.SMS_QUEUE_URL
    })
  })

  test('it handles errors gracefully when sending to SQS fails', async () => {
    // Set up the mock SQS sendMessage function to reject with an error
    AWS.SQS().promise.mockRejectedValue(new Error('SQS Error'))

    const result = await receiveSms.handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body).error).toEqual('Failed to send message')
  })
})
