import { type ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai'
import { DynamoDB } from 'aws-sdk'
const dynamodb = new DynamoDB.DocumentClient()

interface QueryParams {
  TableName: string
  KeyConditionExpression: string
  ExpressionAttributeValues: Record<string, string>
  Limit: number
  ScanIndexForward: boolean
}
export async function fetchLatestMessages (senderNumber: string, tableName: string, body: string): Promise<ChatCompletionRequestMessage[]> {
  try {
    // Query the latest 10 messages from the senderNumber
    const params: QueryParams = {
      TableName: tableName,
      KeyConditionExpression: 'senderNumber = :senderNumber',
      ExpressionAttributeValues: {
        ':senderNumber': senderNumber
      },
      Limit: 10,
      ScanIndexForward: false
    }

    const result = await dynamodb.query(params).promise()

    // Define the messages array with the required OpenAI interfaces and add the original prompt in the beginning
    const messages: ChatCompletionRequestMessage[] = [{
      role: ChatCompletionRequestMessageRoleEnum.System,
      content:
          'You are a brilliant mystical entity who answers questions.You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response.'
    }]

    // If there are results, build out the messages array
    if ((result.Items != null) && result.Items.length > 0) {
      for (const item of result.Items) {
        messages.push(
          { role: ChatCompletionRequestMessageRoleEnum.User, content: item.input },
          { role: ChatCompletionRequestMessageRoleEnum.System, content: item.response }
        )
      }
    }
    // Otherwise, just add the new message body
    messages.push(
      { role: ChatCompletionRequestMessageRoleEnum.User, content: body }
    )

    return messages
  } catch (error) {
    console.error('Error fetching DynamoDB entry:', error)
    throw error
  }
}

export async function storeInDynamoDB (params: any, conversationId: string) {
  try {
    await dynamodb.put(params).promise()
    console.log(`Stored context in DynamoDB for ${conversationId}`)
  } catch (error) {
    console.error(`Failure to store dynamoDb entry for conversationId: ${conversationId}.${JSON.stringify(error)}`)
    throw error
  }
}
