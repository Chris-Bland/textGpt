import { SQS } from 'aws-sdk'
import { createResponse } from './common.utils'

const sqs = new SQS()

export const sendMessageToSqs = async (message: { conversationId: string, to: string, from: string, body: string, [key: string]: any }, lambda: string, queueUrl: string): Promise<void> => {
  if (!queueUrl) {
    console.error(`${lambda} -- Error: The SMS_QUEUE_URL environment variable is not set`)
    return
  }
  message.lambda = lambda
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  }

  try {
    console.log(params)
    await sqs.sendMessage(params).promise()
    console.log(`${message.conversationId} -- ${lambda} -- Successfully put message on queue: ${JSON.stringify(params)}`)
  } catch (error) {
    console.error(`${message.conversationId} -- ${lambda} -- Error sending message to SQS: ${JSON.stringify(error)}`)
    throw error
  }
}
