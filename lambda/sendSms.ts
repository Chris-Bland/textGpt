import twilio from 'twilio'
import { getSecret } from './utils/secrets.util'
import { createResponse } from './utils/common.utils'
import { sendMessage } from './utils/twilio.utils'

const TWILIO_TEST_NUMBER = 'TEST123'

export const handler = async (event: { Records: any }) => {
  try {
    if (!process.env.ERROR_MESSAGE) {
      throw new Error('Environment variable(s) not set')
    }
    const secrets = await getSecret('ChatGPTSecrets')
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    for (const record of event.Records) {
      const { conversationId, to, from, body, lambda, imageUrl } = JSON.parse(record.body)

      if (to === TWILIO_TEST_NUMBER || from === TWILIO_TEST_NUMBER) {
        console.log(`${conversationId} -- SendSMS -- Test Successful!`)
        return createResponse(200, { message: 'Test Successful!' })
      }

      // Error message processing
      if (record.eventSourceARN === process.env.ERROR_QUEUE_ARN) {
        console.log(`${conversationId} -- ErrorSMS -- Error from: ${lambda}`)
        return await sendMessage(client, to, from, process.env.ERROR_MESSAGE)
      }

      // If no error, check if there is an imageUrl, this needs to be an MMS
      if (body) {
        if (imageUrl) return await sendMessage(client, to, from, body, imageUrl)

        return await sendMessage(client, to, from, body)
      }
    }
  } catch (error) {
    console.error(`Error during Twilio setup: ${error}`)
    return createResponse(500, { error: `Error during Twilio setup: ${error}` })
  }
  return createResponse(404, { error: 'No Records Found' })
}
