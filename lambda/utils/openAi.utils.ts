import { OpenAIApi } from 'openai';
import { sendMessageToSqs } from './sqs.util';
import { fetchLatestMessages, storeInDynamoDB } from './dynamoDb.utils';

interface Record {
  body: string;
}

interface Message {
  conversationId: string;
  to: string;
  from: string;
  body: string;
}
class ChatCompletionError extends Error {}
class SqsError extends Error {}
class DynamoDbError extends Error {}

async function createChatCompletion(openai: OpenAIApi, messages: any[]): Promise<string | undefined> {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature:1,
      max_tokens: 256,
      top_p: 1,frequency_penalty: 0, presence_penalty: 0
    });
    return response.data.choices && (response.data.choices[0].message != null) ? response.data.choices[0].message.content : undefined;
  } catch (error) {
    if (error instanceof Error) {
      throw new ChatCompletionError(error.message);
    } else {
      throw error;
    }
  }
}

async function sendToSqs(conversationId: string, to: string, from: string, body: string): Promise<void> {
  try {
    const message = { conversationId, to, from, body };
    if (!process.env.SEND_SMS_QUEUE_URL) {
      throw new Error('SEND_SMS_QUEUE_URL environment variable is not set')
    }
    await sendMessageToSqs(message, 'QueryGPT', process.env.SEND_SMS_QUEUE_URL);
  } catch (error) {
    if (error instanceof Error) {
      throw new SqsError(error.message);
    } else {
      throw error;
    }
  }
}

async function storeConversationInDynamoDB(conversationTableName: string, from: string, to: string, body: string, openAIResponse: string, conversationId: string): Promise<void> {
  try {
    const params = {
      TableName: conversationTableName,
      Item: {
        senderNumber: from,
        TwilioNumber: to,
        input: body,
        response: openAIResponse,
        conversationId,
        timestamp: new Date().toISOString()
      }
    };
    await storeInDynamoDB(params, conversationId);
  } catch (error) {
    if (error instanceof Error) {
      throw new DynamoDbError(error.message);
    } else {
      throw error;
    }
  }
}

export async function processRecord(record: Record, openai: OpenAIApi, conversationTableName: string): Promise<void> {
  try {
    const { conversationId, to, from, body } = JSON.parse(record.body) as Message;

    const messages = await fetchLatestMessages(from, conversationTableName, body);
    console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history.`);

    const openAIResponse = await createChatCompletion(openai, messages);

    if (openAIResponse) {
      console.log(`${conversationId} -- QueryGPT -- OpenAI Success.`);

      await sendToSqs(conversationId, to, from, openAIResponse);
      console.log(`${conversationId} -- QueryGPT -- Successfully placed message on SQS queue.`);

      await storeConversationInDynamoDB(conversationTableName, from, to, body, openAIResponse, conversationId);
    } else {
      console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
    }

  } catch (error) {
    const errorInstance = error as Error;
    const errorMessage = errorInstance.message || 'Unknown error';

    switch (errorInstance.constructor) {
      case ChatCompletionError:
        console.error(`Error creating chat completion with OpenAI: ${errorMessage}`);
        break;
      case SqsError:
        console.error(`Error sending message to SQS: ${errorMessage}`);
        break;
      case DynamoDbError:
        console.error(`Error storing conversation in DynamoDB: ${errorMessage}`);
        break;
      default:
        console.error(`Error processing record: ${errorMessage}`);
        break;
    }
  }
}
