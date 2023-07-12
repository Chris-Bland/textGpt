import { type ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai'
import { DynamoDB } from 'aws-sdk'
import { sendMessageToSqs } from './sqs.util'

const dynamodb = new DynamoDB.DocumentClient()

interface QueryParams {
  TableName: string
  KeyConditionExpression: string
  ExpressionAttributeValues: Record<string, string>
  Limit: number
  ScanIndexForward: boolean
}

export interface DynamoDbParams {
  TableName: string
  Item: {
    senderNumber: string
    TwilioNumber: string
    input: string
    response: string
    conversationId: string
    timestamp: string
  }
}

export async function fetchLatestMessages (senderNumber: string, tableName: string, body: string, prompt: string, conversationId: string, twilioNumber: string): Promise<ChatCompletionRequestMessage[]> {
  if (!process.env.ERROR_QUEUE_URL) {
    throw new Error('ERROR_QUEUE_URL is not defined')
  }
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
      content: prompt
    }]

    // If there are results, build out the messages array of User and Assistant messages, add the prompt again, followed by the new user input
    if ((result.Items != null) && result.Items.length > 0) {
      const conversationPairs: ChatCompletionRequestMessage[][] = []
      // Create the array
      for (const item of result.Items) {
        conversationPairs.push([
          { role: ChatCompletionRequestMessageRoleEnum.User, content: item.input },
          { role: ChatCompletionRequestMessageRoleEnum.Assistant, content: item.response }
        ])
      }
      // Grab the User and Assistant responses and reverse them to ensure they are in the order OpenAI requires, and the User/Assistant order is not changed
      const reversedPairs = conversationPairs.reverse()
      for (const pair of reversedPairs) {
        messages.push(pair[0], pair[1])
      }
      messages.push({
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: prompt
      },
      { role: ChatCompletionRequestMessageRoleEnum.User, content: body })
    }
    // Otherwise just push the new user input. No need to double up on the prompt.
    else {
      messages.push(
        { role: ChatCompletionRequestMessageRoleEnum.User, content: body }
      )
    }
    return messages
  } catch (error) {
    console.error('Error fetching DynamoDB entry:', error)
    const message = { body, to: senderNumber, from: twilioNumber, conversationId }
    await sendMessageToSqs(message, 'QueryGPT', process.env.ERROR_QUEUE_URL)
    throw error
  }
}

export async function storeInDynamoDB (params: DynamoDbParams) {
  const conversationId = params.Item.conversationId
  if (!process.env.ERROR_QUEUE_URL) {
    throw new Error('ERROR_QUEUE_URL is not defined')
  }
  try {
    await dynamodb.put(params).promise()
    console.log(`Stored context in DynamoDB for ${conversationId}`)
  } catch (error) {
    console.error(`Failure to store dynamoDb entry for conversationId: ${conversationId}.${JSON.stringify(error)}`)
    await sendMessageToSqs({ body: params.Item.input, to: params.Item.senderNumber, from: params.Item.TwilioNumber, conversationId }, 'QueryGPT', process.env.ERROR_QUEUE_URL)
    throw error
  }
}
