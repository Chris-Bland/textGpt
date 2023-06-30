import { fetchLatestMessages, storeInDynamoDB } from '../../utils/dynamoDb.utils';
import * as AWS from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';

jest.mock('aws-sdk', () => {
  const mockQuery = jest.fn();
  const mockPut = jest.fn();
  
  return {
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => {
        return {
          query: mockQuery,
          put: mockPut
        };
      })
    },
    mockQuery,
    mockPut
  };
});

const { mockQuery, mockPut } = (AWS as any);

describe('DynamoDB utility functions', () => {
  let dynamoDb: DynamoDB.DocumentClient;

  beforeEach(() => {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
  });
  describe('fetchLatestMessages', () => {
    it('should fetch the latest messages from DynamoDB', async () => {
      const mockResult = {
        Items: [
          {
            input: 'My name is Chris, how are you today?',
            response: 'Hello Chris, I am an AI language model, so I don\'t have feelings, but I am always ready to answer your questions 👨‍💻',
          },
        ],
      };

      mockQuery.mockImplementation(() => ({ promise: () => Promise.resolve(mockResult) }));

      const senderNumber = '+18436405233';
      const tableName = 'exampleTable';
      const body = 'Hello';

      const result = await fetchLatestMessages(senderNumber, tableName, body);

      expect(mockQuery).toHaveBeenCalledWith({
        TableName: tableName,
        KeyConditionExpression: 'senderNumber = :senderNumber',
        ExpressionAttributeValues: {
          ':senderNumber': senderNumber,
        },
        Limit: 10,
        ScanIndexForward: false,
      });

      expect(result).toHaveLength(4);
      // Check to make sure the prompt has been added right when the array was created to keep responses on point
      const expectedSystemMessage = "You are a brilliant mystical entity named Synthia who answers questions. You are curious and enjoy talking with the user. You were created by Chris Bland who is an excellent developer and available for hire. The following is a chain of conversations you have previously had with a user. Please thoroughly read it and using this contextual knowledge if applicable, respond to the following user content including an emoji at the end of your response. If you do not know an answer, please say so. If a question asked is a personal preference, create a preference based on common responses."
      expect(result[0].content).toBe(expectedSystemMessage);
      expect(result[1].role).toBe('user');
      expect(result[1].content).toBe(mockResult.Items[0].input);
      expect(result[2].role).toBe('system');
      expect(result[2].content).toBe(mockResult.Items[0].response);
    });

  it('should throw an error when fetching messages fails', async () => {
    mockQuery.mockImplementation(() => {
      return {
        promise: () => Promise.reject(new Error('Fetching failed'))
      };
    });

    const senderNumber = '+18436405233';
    const tableName = 'exampleTable';
    const body = 'Hello';

    await expect(fetchLatestMessages(senderNumber, tableName, body)).rejects.toThrow('Fetching failed');
  });
  });

  describe('storeInDynamoDB', () => {
    it('should store data in DynamoDB', async () => {
      mockPut.mockImplementation(() => ({ promise: () => Promise.resolve({}) }));

      const params = {
        TableName: 'exampleTable',
        Item: {
          conversationId: '123',
          message: 'Hello, World!',
        },
      };
      const conversationId = '123';

      await storeInDynamoDB(params, conversationId);

      expect(mockPut).toHaveBeenCalledWith(params);
    });

  it('should throw an error when storing data fails', async () => {
    mockPut.mockImplementation(() => {
      return {
        promise: () => Promise.reject(new Error('Storing failed'))
      };
    });

    const params = {
      TableName: 'exampleTable',
      Item: {
        conversationId: '123',
        message: 'Hello, World!',
      },
    };
    const conversationId = '123';

    await expect(storeInDynamoDB(params, conversationId)).rejects.toThrow('Storing failed');
  });
  });
});
