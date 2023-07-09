import { CreateImageRequestSizeEnum, type OpenAIApi } from 'openai'

export async function generateImageUrl (imagePrompt: string, openai: OpenAIApi, imageResolution: CreateImageRequestSizeEnum){
    try {
        const openAiResponse = await openai.createImage({
            prompt: JSON.stringify(imagePrompt),
            n: 1,
            size: imageResolution
          })
          const imageUrl = openAiResponse.data.data[0].url
          console.log(imageUrl)
          return imageUrl;
    } catch (error) {
        console.error(`Failure during Dall-E call: ${JSON.stringify(error)}`)
        throw error
    }
  }
  