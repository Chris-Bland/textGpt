import { Configuration, OpenAIApi } from 'openai'
import { getSecret } from './utils/secrets.util'
import { processRecord } from './utils/openAi.utils'
import { sendMessageToSqs } from './utils/sqs.util'

export const handler = async (event: any): Promise<any> => {
 //Receive a prompt from the delimited portion of the openAI response. 
 // pre-process with some prompt engineering for Dall-e
 // send a request to Dall-e to generate image based on prompt
 // If image
 // ---Store in S3
 // --Send to queue for MMS sending in send lambda
 // If error
 // -- Send an error response, but still make sure to send the original response without the image.
 
}
