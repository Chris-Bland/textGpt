import twilio from 'twilio'
import { getSecret } from './utils/secrets.util'
import { sendMessageToSqs } from './utils/sqs.util'

export const handler = async (event: { Records: any }) => {
  try {
    const secrets = await getSecret('ChatGPTSecrets')
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    for (const record of event.Records) {
      const { conversationId, to, from, body } = JSON.parse(record.body)
      try {
        if (body) {
          const message = await client.messages.create({
            body: body + '    --TextGPT',
            from: to,
            to: from
          })
          console.log(`${conversationId} -- SendSMS -- Message sent: ${message.sid}`)
        }
      } catch (error) {
        console.error(`${conversationId} -- SendSMS -- Error during processing record: ${error}`)
        const errorMessage = { conversationId, to, from, body: JSON.stringify(error) }
        await sendMessageToSqs(errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL)
      }
    }
  } catch (error) {
    console.error(`Error during Twilio setup: ${error}`)
  }
}
