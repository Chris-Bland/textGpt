import { type OpenAIApi } from 'openai'
import { sendMessageToSqs } from './sqs.util'
import { fetchLatestMessages, storeInDynamoDB } from './dynamoDb.utils'

export async function processRecord (record: any, openai: OpenAIApi, conversationTableName: string) {
  const { conversationId, to, from, body } = JSON.parse(record.body)

  const messages = await fetchLatestMessages(from, conversationTableName, body)
  console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history.`)

  const holden = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages
  })
  const openAIResponse = holden.data.choices && (holden.data.choices[0].message != null) ? holden.data.choices[0].message.content : undefined

  if (openAIResponse) {
    console.log(`${conversationId} -- QueryGPT -- OpenAI Success`)
    const message = { conversationId, to, from, body: openAIResponse }
    await sendMessageToSqs(message, 'QueryGPT', process.env.SEND_SMS_QUEUE_URL)
    console.log(`${conversationId} -- QueryGPT -- Successfully placed message on SQS queue.`)

    const params = {
      TableName: conversationTableName,
      Item: {
        senderNumber: from,
        TwilioNumber: to,
        input: body,
        response: openAIResponse,
        conversationId,
        timestamp: new Date().toISOString()
      }
    }
    await storeInDynamoDB(params, conversationId)
  } else {
    console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`)
  }
}
