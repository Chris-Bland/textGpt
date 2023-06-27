import twilio from 'twilio'
import { getSecret } from './utils/secrets.util'
import { createResponse } from './utils/common.utils'
import { sendSms } from './utils/twilio.utils'

const TWILIO_TEST_NUMBER = 'TEST123'
const ERROR_MESSAGE_BODY = 'Unfortunately we encountered an issue. Please try again. If this issue persists, please try again later.'

export const handler = async (event: { Records: any }) => {
  try {
    const secrets = await getSecret('ChatGPTSecrets')
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    for (const record of event.Records) {
      const { conversationId, to, from, body, lambda } = JSON.parse(record.body)

      if (to === TWILIO_TEST_NUMBER || from === TWILIO_TEST_NUMBER) {
        console.log(`${conversationId} -- SendSMS -- Test Successful!`)
        return createResponse(200, { message: 'Test Successful!' })
      }

      if (record.eventSourceARN === process.env.ERROR_QUEUE_ARN) {
        console.log(`${conversationId} -- ErrorSMS -- Error from: ${lambda}`)
        return await sendSms(client, to, from, ERROR_MESSAGE_BODY)
      }

      if (body) {
        return await sendSms(client, to, from, body)
      }
    }
  } catch (error) {
    console.error(`Error during Twilio setup: ${error}`)
    return createResponse(500, { error: `Error during Twilio setup: ${error}` })
  }
  return createResponse(404, { error: 'No Records Found' })
}
