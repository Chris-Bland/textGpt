import { SQS } from 'aws-sdk'
const sqs = new SQS()

export async function sendMessageToSqs (message: { conversationId: string, to: string, from: string, body: string, [key: string]: any }, lambda: string, queueUrl: string | undefined): Promise<void> {
  if (!queueUrl) {
    console.error('ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set')
    return
  }
  message.lambda = lambda

  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  }

  try {
    await sqs.sendMessage(params).promise()
    console.log(`${message.conversationId} -- ${lambda} -- Successfully put message on queue: ${JSON.stringify(params)}`)
  } catch (error) {
    console.error(`${message.conversationId} -- ${lambda} -- Error sending message to SQS: ${JSON.stringify(error)}`)
  }
}
