import { parseTwilioEventValues } from './utils/twilio.utils'
import { sendMessageToSqs } from './utils/sqs.util'
import { createResponse } from './utils/common.utils'

export const handler = async (event: { body: any }) => {
  try {
    if (!process.env.SMS_QUEUE_URL) {
      throw new Error('SMS_QUEUE_URL environment variable is not set')
    }

    const message = parseTwilioEventValues(event.body)

    // Process the message, place it on the SQS queue, and return the response
    await sendMessageToSqs(message, 'ReceiveSMS', process.env.SMS_QUEUE_URL)
    return createResponse(200, { message: `Success! ConversationID: ${message.conversationId}.` })
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check if the error is due to a missing environment variable
      if (error.message === 'SMS_QUEUE_URL environment variable is not set') {
        return createResponse(500, { error: `Server configuration error: ${error.message}` })
      } else if (error.message === 'ReceiveSms -- Required values are missing in the request body.') {
        return createResponse(400, { error: `Invalid Request Content: ${error.message}` })
      } else {
        return createResponse(500, { error: `Unexpected error: ${error.message}` })
      }
    }
    // Default case for other errors
    return createResponse(500, { error: `Failed to send message: ${error}` })
  }
}
