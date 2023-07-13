import { type CreateImageRequestSizeEnum, type OpenAIApi } from 'openai'

export async function generateImageUrl (imagePrompt: string, openai: OpenAIApi, imageResolution: CreateImageRequestSizeEnum): Promise<string> {
  try {
    const openAiResponse = await openai.createImage({
      prompt: JSON.stringify(imagePrompt),
      n: 1,
      size: imageResolution
    })
    if (openAiResponse.data.data.length > 0 && openAiResponse.data.data[0].url) {
      return openAiResponse.data.data[0].url
    }
    throw 'Invalid ImageUrl'
  } catch (error) {
    console.error(`Failure during Dall-E call: ${JSON.stringify(error)}`)
    throw error
  }
}
