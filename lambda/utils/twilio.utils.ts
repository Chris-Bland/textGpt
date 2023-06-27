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
      body: body + '    --TextGPT',
      from: to,
      to: from
    })
    console.log(`Message sent: ${message.sid}`)
    return createResponse(200, { message: 'Message sent successfully' })
  } catch (error) {
    console.error(`Error sending message: ${error}`)
    return createResponse(500, { error: `Failed to send message: ${error}` })
  }
}
