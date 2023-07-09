import { Configuration, CreateImageRequestSizeEnum, OpenAIApi } from 'openai'
import { sendMessageToSqs } from './utils/sqs.util'
import { delimiterProcessing } from './utils/common.utils'
import { getSecret } from './utils/secrets.util'
import { generateImageUrl } from './utils/dalle.utils'

interface Message {
  conversationId: string
  to: string
  from: string
  body: string
}

export const handler = async (event: any): Promise<any> => {
  // Receive a prompt from the delimited portion of the openAI response.
  // pre-process with some prompt engineering for Dall-e
  // send a request to Dall-e to generate image based on prompt
  // If image
  // ---Store in S3
  // --Send to queue for MMS sending in send lambda
  // If error
  // -- Send an error response, but still make sure to send the original response without the image.
  if (!process.env.ERROR_QUEUE_URL) {
    throw new Error('QueryGPT -- ERROR_QUEUE_URL is missing.')
  }
  try {
    const secrets = await getSecret('ChatGPTSecrets')
      
    if (!process.env.SEND_SMS_QUEUE_URL || !process.env.IMAGE_RESOLUTION) {
      throw new Error('Environment variable(s) not set')
    }
    if (!secrets || !secrets.OPENAI_API_KEY || !secrets.PROMPT) {
      throw new Error('QueryGPT -- Unable to retrieve secrets')
    }
    const configuration = new Configuration({
      apiKey: secrets.OPENAI_API_KEY
    })
    const openai = new OpenAIApi(configuration)

    for (const record of event.Records) {
      console.log(`Event Record: ${JSON.stringify(record.body)}`)

      const { conversationId, to, from, body } = JSON.parse(record.body) as Message
      const { response, imagePrompt } = delimiterProcessing(body)

      if (imagePrompt.length <= 0) {
        await sendMessageToSqs({ conversationId, to, from, body: response }, 'ImageProcessor', process.env.SEND_SMS_QUEUE_URL)
        throw new Error('ImageProcessor -- Image Prompt is missing or no end delimiter found')
      }
      console.log(`ImagePrompt: ${imagePrompt}`)

      const imageResolution = process.env.IMAGE_RESOLUTION as CreateImageRequestSizeEnum;

      //The image resolution value must be: 256x256, 512x512, or 1024x1024
      if (!Object.values(CreateImageRequestSizeEnum).includes(imageResolution)) {
        throw new Error(`Invalid IMAGE_RESOLUTION value: ${imageResolution}`);
      }
      const imageUrl = await generateImageUrl(imagePrompt, openai, imageResolution)
      console.log(`ImageProcessor -- ImageUrl: ${imageUrl}`)
      const message = { conversationId, to, from, body: response, imageUrl }

      await sendMessageToSqs(message, 'ImageProcessor', process.env.SEND_SMS_QUEUE_URL)
    }
  } catch (error) {
    console.log(`ImageProcessor error: ${error}`)
  }
}
