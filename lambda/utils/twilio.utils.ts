import { createResponse } from './common.utils'

export function parseTwilioEventValues (requestBody: string) {
  const parsedBody = new URLSearchParams(requestBody)
  const body = parsedBody.get('Body')
  const to = parsedBody.get('To')
  const from = parsedBody.get('From')
  const conversationId = parsedBody.get('MessageSid')
  if (!body || !to || !from || !conversationId) {
    throw new Error('ReceiveGPT -- Required values are missing in the request body.')
  }
  return {
    conversationId,
    to,
    from,
    body
  }
}
export async function sendSms (client: any, to: string, from: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: to,
      to: from
    })
    console.log(`Sms message sent: ${message.sid}`)
    return createResponse(200, { message: 'Message sent successfully' })
  } catch (error) {
    console.error(`Error sending sms message: ${error}`)
    return createResponse(500, { error: `Failed to send message: ${error}` })
  }
}

export async function sendMms (client: any, to: string, from: string, body: string, imageUrl: string) {
  try {
    const message = await client.messages.create({
      body: `${body}. Image Url: ${imageUrl}`,
      from: to,
      to: from
    })
    console.log(`Mms message sent: ${message.sid}`)
    return createResponse(200, { message: 'Message sent successfully' })
  } catch (error) {
    console.error(`Error sending mms message: ${error}`)
    return createResponse(500, { error: `Failed to send message: ${error}` })
  }
}
