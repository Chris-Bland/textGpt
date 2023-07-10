import { Configuration, CreateImageRequestSizeEnum, OpenAIApi } from 'openai'
import { sendMessageToSqs } from './utils/sqs.util'
import { delimiterProcessor } from './utils/common.utils'
import { getSecret } from './utils/secrets.util'
import { generateImageUrl } from './utils/dalle.utils'
import { storeImageInS3 } from './utils/s3.utils'

interface Message {
  conversationId: string
  to: string
  from: string
  body: string
}

export const handler = async (event: any): Promise<any> => {
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
      const { response, imagePrompt } = delimiterProcessor(body)

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

      //Send the message to the SQS queue to be sent as MMS
      await sendMessageToSqs(message, 'ImageProcessor', process.env.SEND_SMS_QUEUE_URL)

      // Store the image in S3
      await storeImageInS3(imageUrl, conversationId);
    }
  } catch (error) {
    console.log(`ImageProcessor error: ${error}`)
  }
}
