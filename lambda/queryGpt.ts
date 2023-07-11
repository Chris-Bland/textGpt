import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { createChatCompletion} from './utils/gpt.utils'
import { sendMessageToSqs } from './utils/sqs.util'
import { type DynamoDbParams, storeInDynamoDB, fetchLatestMessages } from './utils/dynamoDb.utils'
import { delimiterProcessor, imageCooldownCheck } from './utils/common.utils'
interface Message {
  conversationId: string
  to: string
  from: string
  body: string
}

export const handler = async (event: any): Promise<any> => {
  if (!process.env.ERROR_QUEUE_URL) {
    console.error('QueryGPT -- ERROR Queue Url variable missing.')
    return
  }
  try {
    const secrets = await getSecret('ChatGPTSecrets')

    if (!secrets || !secrets.OPENAI_API_KEY || !secrets.PROMPT) {
      throw new Error('QueryGPT -- Unable to retrieve secrets')
    }
    if (!process.env.CONVERSATION_TABLE_NAME  || !process.env.MODEL || !process.env.START_DELIMITER || !process.env.END_DELIMITER || !process.env.IMAGE_PROCESSOR_QUEUE_URL || !process.env.SEND_SMS_QUEUE_URL || !process.env.IMAGE_COOLDOWN ) {
      throw new Error('QueryGPT -- Environment Variable(s) missing')
    }
    const configuration = new Configuration({
      apiKey: secrets.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)
    
    const startDelimiter = process.env.START_DELIMITER
    const endDelimiter = process.env.END_DELIMITER

    for (const record of event.Records) {
      const { conversationId, to, from, body } = JSON.parse(record.body) as Message

      const messages = await fetchLatestMessages(from, process.env.CONVERSATION_TABLE_NAME, body, secrets.PROMPT, from, conversationId)
      console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history.`)
      console.log(`MESSAGES: ${JSON.stringify(messages)}`)
    
      const openAIResponse = await createChatCompletion(openai, messages, process.env.MODEL)
      if (!openAIResponse) {
        throw new Error(`${conversationId} -- QueryGPT -- No response from OpenAI`)
      }
      console.log(`${conversationId} -- QueryGPT -- OpenAI Success.`)
    
    // Check if any of the last three assistant messages have a delimiter. If so, the image generation will be on cooldown.
    const imageOnCooldown = imageCooldownCheck(messages, process.env.START_DELIMITER, process.env.IMAGE_COOLDOWN)
    let imagePrompt = openAIResponse.includes(startDelimiter)
    let sqsMessage = openAIResponse
    if (imagePrompt && imageOnCooldown) {
      imagePrompt = false
      const { response } = delimiterProcessor(openAIResponse, startDelimiter, endDelimiter)
      sqsMessage = response
      console.log('Prompt detected, but image generation on cooldown.')
    }

      const message = { conversationId, to, from, body: sqsMessage }
      const queueUrl = imagePrompt ? process.env.IMAGE_PROCESSOR_QUEUE_URL : process.env.SEND_SMS_QUEUE_URL

      if (!queueUrl) {
        throw new Error('SQS Queue environment variable(s) not set')
      }
      await sendMessageToSqs(message, 'QueryGPT', queueUrl)
      console.log(`${conversationId} -- QueryGPT -- Successfully placed on SQS queue.`)

      const params = {
        TableName: process.env.CONVERSATION_TABLE_NAME,
        Item: {
          senderNumber: from,
          TwilioNumber: to,
          input: body,
          response: `${sqsMessage}${imagePrompt}`,
          conversationId,
          timestamp: new Date().toISOString()
        }
      } as DynamoDbParams
      await storeInDynamoDB(params)
    }
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`)
    const errorMessage = { conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error) }
    await sendMessageToSqs(errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL)
  }
}
