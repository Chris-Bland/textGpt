import * as AWS from 'aws-sdk';
import { ChatCompletionRequestMessageRoleEnum }  from 'openai';

const dynamodb = new AWS.DynamoDB.DocumentClient();
interface QueryParams {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: { [key: string]: string };
    Limit: number;
    ScanIndexForward: boolean;
  }

export async function fetchLatestMessages(senderNumber: string, tableName: string, body: string): Promise<Array<{ role: string, content: string }>> {
  try {
    // Query the latest 10 messages from the senderNumber
    const params: QueryParams = {
      TableName: tableName,
      KeyConditionExpression: 'senderNumber = :senderNumber',
      ExpressionAttributeValues: {
        ':senderNumber': senderNumber,
      },
      Limit: 10,
      ScanIndexForward: false, // Sort in descending order to get the latest messages
    };
    
    const result = await dynamodb.query(params).promise();

    const messages: Array<{ role: ChatCompletionRequestMessageRoleEnum, content: string }> = [];


    if (result.Items) {
        for (const item of result.Items) {
            messages.push(
                { role: ChatCompletionRequestMessageRoleEnum.User, content: item.input }, 
                { role: ChatCompletionRequestMessageRoleEnum.System, content: item.response }, 
            );
        }
        messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: body },)
    } else {
        messages.push(
            {
                role: ChatCompletionRequestMessageRoleEnum.System, 
                content: 'You are a brilliant mystical entity who answers questions. You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response.',
            },
            { role: ChatCompletionRequestMessageRoleEnum.User, content: body }, 
        )
    }
    return messages.reverse();
  } catch (error) {
    console.error('Error fetching DynamoDB entry:', error);
    throw error;
  }
}
