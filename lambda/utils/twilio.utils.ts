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
