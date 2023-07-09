import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { processRecord } from './utils/openAi.utils'
import { sendMessageToSqs } from './utils/sqs.util'
console.log('ImageProcessor --')
export const handler = async (event: any): Promise<any> => {
  if (!process.env.ERROR_QUEUE_URL) {
    throw new Error('QueryGPT -- ERROR_QUEUE_URL is missing.')
  }
  try {
    if (!process.env.SEND_SMS_QUEUE_URL) {
      throw new Error('SEND_SMS_QUEUE_URL environment variable is not set')
    }
    console.log(`ImageProcessor -- ${JSON.stringify(event.Records[0])}`)
    await sendMessageToSqs(event.Records[0], 'ImageProcessor', process.env.SEND_SMS_QUEUE_URL)
  } catch (error) {
    console.log(`ImageProcessor error: ${error}`)
  }
  // Receive a prompt from the delimited portion of the openAI response.
  // pre-process with some prompt engineering for Dall-e
  // send a request to Dall-e to generate image based on prompt
  // If image
  // ---Store in S3
  // --Send to queue for MMS sending in send lambda
  // If error
  // -- Send an error response, but still make sure to send the original response without the image.
}
