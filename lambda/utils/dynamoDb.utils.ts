import * as AWS from 'aws-sdk';

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

    // Format the messages into the required array of objects
    const messages: Array<{ role: string, content: string }> = [];

    //if there are results, build out the messages array
    if (result.Items) {
      for (const item of result.Items) {
        messages.push(
            { role: 'user', content: item.input },
            { role: 'system', content: item.response },
        );
      }
      messages.push({ role: 'user', content: body },)
    } else{
        messages.push(
        {
            role: 'system',
            content:
              'You are a brilliant mystical entity who answers questions.You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response.',
          },
          { role: 'user', content: body },
        )
    }
    return messages;
  } catch (error) {
    console.error('Error fetching DynamoDB entry:', error);
    throw error;
  }
}
