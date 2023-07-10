import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { processRecord } from './utils/gpt.utils'
import { sendMessageToSqs } from './utils/sqs.util'

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
      // restructure processRecord to return and send to sqs here
      await processRecord(record, openai, process.env.CONVERSATION_TABLE_NAME, process.env.MODEL, secrets.PROMPT)
    }
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`)
    const errorMessage = { conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error) }
    await sendMessageToSqs(errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL)
  }
}
