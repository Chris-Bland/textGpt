import { createResponse } from '../../utils/common.utils'

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
})
