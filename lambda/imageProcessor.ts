import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { processRecord } from './utils/openAi.utils'
import { sendMessageToSqs } from './utils/sqs.util'

export const handler = async (event: any): Promise<any> => {
  if (!process.env.ERROR_QUEUE_URL) {
    throw new Error('ImageProcessor -- ERROR_QUEUE_URL is undefined.')
  }
  try {
    const secrets = await getSecret('ChatGPTSecrets')

    if (!secrets || !secrets.OPENAI_API_KEY) {
      throw new Error('ImageProcessor -- Unable to retrieve OpenAI API Key from secrets')
    }

    const configuration = new Configuration({
      apiKey: secrets.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    if (!process.env.CONVERSATION_TABLE_NAME) {
      throw new Error('QueryGPT -- CONVERSATION_TABLE_NAME environment variable is missing')
    }

    for (const record of event.Records) {
      await processRecord(record, openai, process.env.CONVERSATION_TABLE_NAME)
    }
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`)
    const errorMessage = { conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error) }
    await sendMessageToSqs(errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL)
  }
}
