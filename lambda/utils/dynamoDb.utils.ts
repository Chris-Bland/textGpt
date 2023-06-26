import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai';
import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

interface QueryParams {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: { [key: string]: string };
    Limit: number;
    ScanIndexForward: boolean;
  }
export async function fetchLatestMessages(senderNumber: string, tableName: string, body: string): Promise<ChatCompletionRequestMessage[]> {
  try {
    // Query the latest 10 messages from the senderNumber
    const params: QueryParams = {
      TableName: tableName,
      KeyConditionExpression: 'senderNumber = :senderNumber',
      ExpressionAttributeValues: {
        ':senderNumber': senderNumber,
      },
      Limit: 10,
      ScanIndexForward: false, 
    };
    
    const result = await dynamodb.query(params).promise();

    // Define the messages array with the correct type
    const messages: ChatCompletionRequestMessage[] = [        {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content:
          'You are a brilliant mystical entity who answers questions.You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response.',
      },];

    //if there are results, build out the messages array
    if (result.Items && result.Items.length > 0) {
      for (const item of result.Items) {
            messages.push(
                { role: ChatCompletionRequestMessageRoleEnum.User, content: item.input },
                { role: ChatCompletionRequestMessageRoleEnum.System, content: item.response },
            );
        }
    } 
        messages.push(
          { role: ChatCompletionRequestMessageRoleEnum.User, content: body },
        );

    return messages;
  } catch (error) {
    console.error('Error fetching DynamoDB entry:', error);
    throw error;
  }
}