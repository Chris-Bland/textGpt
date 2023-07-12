import { fetchLatestMessages, storeInDynamoDB } from '../../utils/dynamoDb.utils'
import * as AWS from 'aws-sdk'
import { type DynamoDB } from 'aws-sdk'

jest.mock('aws-sdk', () => {
  const mockQuery = jest.fn()
  const mockPut = jest.fn()
  const mockSendMessage = jest.fn().mockImplementation(() => ({
    promise: jest.fn()
  }))

  return {
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => {
        return {
          query: mockQuery,
          put: mockPut
        }
      })
    },
    SQS: jest.fn().mockImplementation(() => {
      return {
        sendMessage: mockSendMessage
      }
    }),
    mockQuery,
    mockPut,
    mockSendMessage
  }
})

const { mockSendMessage, mockQuery, mockPut } = (AWS as any)

describe('DynamoDB utility functions', () => {
  let dynamoDb: DynamoDB.DocumentClient
  const prompt = 'test-prompt'
  const senderNumber = '+18436405233'
  const twilioNumber = '+14563337654'
  const tableName = 'exampleTable'
  const body = 'Hello'
  const conversationId = '123'

  beforeEach(() => {
    dynamoDb = new AWS.DynamoDB.DocumentClient()
    process.env.ERROR_QUEUE_URL = 'ERROR_QUEUE'
  })
  describe('fetchLatestMessages', () => {
    it('should fetch the latest messages from DynamoDB', async () => {
      const mockResult = {
        Items: [
          {
            input: 'My name is Chris, how are you today?',
            response: 'Hello Chris, I am an AI language model, so I don\'t have feelings, but I am always ready to answer your questions 👨‍💻'
          }
        ]
      }

      mockQuery.mockImplementation(() => ({ promise: async () => await Promise.resolve(mockResult) }))
      const result = await fetchLatestMessages(senderNumber, tableName, body, prompt, conversationId, twilioNumber)

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: tableName,
        KeyConditionExpression: 'senderNumber = :senderNumber',
        ExpressionAttributeValues: {
          ':senderNumber': senderNumber
        },
        Limit: 10,
        ScanIndexForward: false
      })

      expect(result).toHaveLength(5)
      // Check to make sure the prompt has been added right when the array was created to keep responses on point
      const expectedSystemMessage = 'test-prompt'
      expect(result[0].content).toBe(expectedSystemMessage)
      expect(result[0].role).toBe('system')
      expect(result[1].role).toBe('user')
      expect(result[1].content).toBe(mockResult.Items[0].input)
      expect(result[2].role).toBe('assistant')
      expect(result[2].content).toBe(mockResult.Items[0].response)
    })

    it('should throw an error when fetching messages fails', async () => {
      mockQuery.mockImplementation(() => {
        return {
          promise: () => Promise.reject(new Error('Fetching failed'))
        }
      })
      await expect(fetchLatestMessages(senderNumber, tableName, body, prompt, conversationId, twilioNumber)).rejects.toThrow('Fetching failed')
    })
  })

  describe('storeInDynamoDB', () => {
    it('should store data in DynamoDB', async () => {
      mockPut.mockImplementation(() => ({ promise: async () => await Promise.resolve({}) }))

      const params = {
        TableName: tableName,
        Item: {
          senderNumber: senderNumber,
          TwilioNumber: twilioNumber,
          input: 'Test',
          response: 'Test',
          conversationId: conversationId,
          timestamp: '1234567',
        }
      }

      await storeInDynamoDB(params)

      expect(mockPut).toHaveBeenCalledWith(params)
    })

    it('should throw an error when storing data fails', async () => {
      mockPut.mockImplementation(() => {
        return {
          promise: () => Promise.reject(new Error('Storing failed'))
        }
      })
    
      const params = {
        TableName: tableName,
        Item: {
          senderNumber: senderNumber,
          TwilioNumber: twilioNumber,
          input: 'Test',
          response: 'Test',
          conversationId: conversationId,
          timestamp: '1234567',
        }
      }
    
      await expect(storeInDynamoDB(params)).rejects.toThrow('Storing failed')
    })
  })
})
