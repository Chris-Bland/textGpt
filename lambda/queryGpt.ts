import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { processRecord } from './utils/gpt.utils'
import { sendMessageToSqs } from './utils/sqs.util'
import { DynamoDbParams, storeInDynamoDB } from './utils/dynamoDb.utils'

export const handler = async (event: any): Promise<any> => {
  if (!process.env.ERROR_QUEUE_URL) {
    console.error('QueryGPT -- ERROR_QUEUE_URL is missing.')
    return
  }

  if (!process.env.MODEL) {
    console.error('QueryGPT -- MODEL is missing')
    return
  }

  try {
    const secrets = await getSecret('ChatGPTSecrets')

    if (!secrets || !secrets.OPENAI_API_KEY || !secrets.PROMPT) {
      throw new Error('QueryGPT -- Unable to retrieve secrets')
    }
    if (!process.env.CONVERSATION_TABLE_NAME) {
      throw new Error('QueryGPT -- CONVERSATION_TABLE_NAME is missing')
    }
    const configuration = new Configuration({
      apiKey: secrets.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    for (const record of event.Records) {
      const { conversationId, to, from, sqsMessage, imagePrompt, body } = 
        await processRecord(record, openai, process.env.CONVERSATION_TABLE_NAME, process.env.MODEL, secrets.PROMPT);

        const message = { conversationId, to, from, body:sqsMessage };
        const queueUrl = imagePrompt ? process.env.IMAGE_PROCESSOR_QUEUE_URL : process.env.SEND_SMS_QUEUE_URL;
        
        if (!queueUrl) {
          throw new Error('SQS Queue environment variable(s) not set');
        }
        await sendMessageToSqs(message, 'QueryGPT', queueUrl);
      console.log(`${conversationId} -- QueryGPT -- Successfully placed on SQS queue.`);

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
      await storeInDynamoDB(params);
    }
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`)
    const errorMessage = { conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error) }
    await sendMessageToSqs(errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL)
  }
}