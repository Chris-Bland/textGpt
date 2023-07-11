import { delimiter } from 'path'
import { createResponse, delimiterProcessor } from '../../utils/common.utils'

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
})
