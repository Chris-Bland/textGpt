import twilio from 'twilio'
import { getSecret } from './utils/secrets.util'

export const handler = async (event: { Records: any }) => {
  console.log(`SendSms -- event: ${event}`);
  console.log(`SendSms -- event string: ${JSON.stringify(event)}`);

  try {
    const secrets = await getSecret('ChatGPTSecrets')
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    for (const record of event.Records) {
      const { conversationId, to, from, body } = JSON.parse(record.body)
      
      if (to === "TEST123" || from === "TEST123") {
        console.log(`${conversationId} -- SendSMS -- Test Successful!`);
        return
      }
      console.log(`Logging Arns. Process: ${process.env.ERROR_QUEUE_ARN}`)
      console.log(`Logging Arns. record: ${record.eventSourceARN}`)
      if (record.eventSourceARN === process.env.ERROR_QUEUE_ARN) {
        const { lambda }= JSON.parse(record.body)
        console.log(`${conversationId} -- ErrorSMS -- Error from: ${lambda}`)
        const message = await client.messages.create({
          body: 'Unfortuntately we encountered an issue. Please try again. If this issue persists, please try again later.    --TextGPT',
          from: to,
          to: from
        })
        console.log(`${conversationId} -- ErrorSMS -- Message sent successfully: ${message.sid}`)
      }

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
      }
    }
  } catch (error) {
    console.error(`Error during Twilio setup: ${error}`)
  }
}
