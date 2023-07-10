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
export async function sendMessage (client: any, to: string, from: string, body: string, imageUrl?: string) {
  const messageType = imageUrl ? 'MMS' : 'SMS'
  const mediaUrl = imageUrl || undefined
  console.log(`Twilio ImageUrl: ${mediaUrl}`)
  try {
    const message = await client.messages.create({
      body,
      from: to,
      to: from,
      mediaUrl
    })
    console.log(`${messageType} message sent: ${message.sid}`)
    return createResponse(200, { message: `${messageType} message sent successfully` })
  } catch (error) {
    console.error(`Error sending ${messageType} message: ${error}`)
    return createResponse(500, { error: `Failed to send ${messageType} message: ${error}` })
  }
}
