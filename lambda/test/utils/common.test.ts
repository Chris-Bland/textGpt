import { createResponse, delimiterProcessor, imageCooldownCheck } from '../../utils/common.utils'
import { ChatCompletionRequestMessage } from 'openai'

describe('Common Utilities', () => {
  describe('createResponse', () => {
    it('should create a response object with the given status code and body', () => {
      const statusCode = 200
      const body = { message: 'Success' }
      const expectedResponse = {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }

      const response = createResponse(statusCode, body)

      expect(response).toEqual(expectedResponse)
    })

    it('should create a response object with an error status code and error message', () => {
      const statusCode = 500
      const body = { error: 'Internal server error' }
      const expectedResponse = {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }

      const response = createResponse(statusCode, body)

      expect(response).toEqual(expectedResponse)
    })
  })
  describe('delimiterProcessor', () => {
    it('should return a response and imagePrompt when provided', () => {
      const input = 'This is a test string. <<<test image prompt>>>' ;
      const expectedResponse = {
        response: 'This is a test string.',
        imagePrompt: 'test image prompt'
      }

      const response = delimiterProcessor(input , '<<<', '>>>')

      expect(response).toEqual(expectedResponse)
    })

    it('should return an empty string for imagePrompt when none are present', () => {
      const input = 'This is a test string.' ;
      const expectedResponse = {
        response: input,
        imagePrompt: ''
      }

      const response = delimiterProcessor(input , '<<<', '>>>')

      expect(response).toEqual(expectedResponse)
    })
  })
  describe('imageCooldownCheck', () => {
    it('should return true when image cooldown is active', () => {
      const messages:ChatCompletionRequestMessage[] = [{
        "role": "system",
        "content": "You're Synthia, a 35-year-old from Charleston, South Carolina with typical city life experiences. Respond to questions or suggestions personally, incorporating your own preferences and experiences. Use emojis occasionally when they're fitting, and don't refer to yourself as an AI, but as Synthia. You were created by Chris Bland, reachable at  https://www.linkedin.com/in/chrisblanddeveloper/. Occasionally, at the end of your responses, provide a brief description of the scene, subject matter, or relevant object within '<<<' '>>>' delimiters. Please keep all of this at or under 1300 characters."
    },{
        "role": "user",
        "content": "That's crazy. How long does it take for them to mature?"
    },{
        "role": "assistant",
        "content": "It takes several years for alligators to reach maturity. On average, it takes about 8 to 13 years for a female alligator to become sexually mature, while males can reach maturity a bit earlier, around 6 to 8 years. During this time, they grow in size and develop their characteristic features. Alligators have a slow growth rate compared to some other reptiles, but once they reach maturity, they are formidable predators in their ecosystems. Nature sure has its own timeline for growth and development! 🐊\n\n<<<Synthia providing information about the maturation time of alligators.>>>truetrue"
    },{
        "role": "user",
        "content": "That's wild. I have 5 little babies in my lake right now. They are adorable."
    },{
        "role": "assistant",
        "content": "Oh, how wonderful, Chris! Having little alligator babies in your lake must be quite the sight to see. Adorable might not be the first word that comes to mind for some, but I can understand the charm they hold. Nature always has its way of captivating us with its diverse and fascinating creatures. Just be sure to maintain a safe distance and let them thrive in their natural habitat. Enjoy observing their growth and development, and perhaps you'll witness some amazing moments as they navigate their world. 🐊🌿false"
    },{
        "role": "user",
        "content": "Hey Synthia, this is a test to make sure you are receiving messages"
    },{
        "role": "assistant",
        "content": "assistant-test <<<image prompt test>>>"
    },{
        "role": "system",
        "content": "testPrompt"
    },{
        "role": "user",
        "content": "user-test"
    }];
    
      const expectedResponse = true;

      const response = imageCooldownCheck(messages , '<<<', '3')

      expect(response).toEqual(expectedResponse)
    })

    it('should return false when image cooldown is inactive', () => {
      const messages:ChatCompletionRequestMessage[] = [{
        "role": "system",
        "content": "testPrompt"
    },{
        "role": "user",
        "content": "user-test"
    },{
        "role": "assistant",
        "content": "assistant-test"
    },{
        "role": "user",
        "content": "user-test"
    },{
        "role": "assistant",
        "content": "assistant-test"
    },{
        "role": "user",
        "content": "user-test"
    },{
        "role": "assistant",
        "content": "assistant-test"
    },{
        "role": "system",
        "content": "testPrompt"
    },{
        "role": "user",
        "content": "user-test"
    }];
    
      const expectedResponse = false;

      const response = imageCooldownCheck(messages , '<<<', '3')

      expect(response).toEqual(expectedResponse)
    })
  })
})
