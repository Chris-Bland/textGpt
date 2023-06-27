import { SQS } from 'aws-sdk'
import { sendMessageToSqs } from './utils/sqs.util'
import { parseTwilioEventValues } from './utils/twilio.utils'
const sqs = new SQS()

export const handler = async (event: { body: any }) => {
  try {
    console.log(`Twilio Content: ${JSON.stringify(event)}`)
    const message = parseTwilioEventValues(event.body)
    try {
      await sendMessageToSqs(message, 'ReceiveSMS', process.env.SMS_QUEUE_URL)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Success! ConversationID: ${message.conversationId}.`
        })
      }
    } catch (error) {
      await sendMessageToSqs(message, 'ReceiveSMS', process.env.ERROR_QUEUE_URL)
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Failed to send message: ${error}`
        })
      }
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Invalid Request Content: ${error}`
      })
    }
  }
}
