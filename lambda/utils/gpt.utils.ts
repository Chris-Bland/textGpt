import { type OpenAIApi } from 'openai'
import { sendMessageToSqs } from './sqs.util'
import { fetchLatestMessages, storeInDynamoDB, DynamoDbParams } from './dynamoDb.utils'
import { delimiterProcessor, imageCooldownCheck } from './common.utils'

interface Record {
  body: string
}

interface Message {
  conversationId: string
  to: string
  from: string
  body: string
}



async function createChatCompletion (openai: OpenAIApi, messages: any[], model: string): Promise<string | undefined> {
  const response = await openai.createChatCompletion({
    model,
    messages,
    temperature: 1, // set to 0 to make deterministic
    max_tokens: 256,
    frequency_penalty: 0,
    presence_penalty: 0
  })
  return response.data.choices && response.data.choices[0]?.message?.content;
}

async function sendToSqs (conversationId: string, to: string, from: string, body: string, imagePrompt?: boolean): Promise<void> {
  const message = { conversationId, to, from, body };
  const queueUrl = imagePrompt ? process.env.IMAGE_PROCESSOR_QUEUE_URL : process.env.SEND_SMS_QUEUE_URL;
  
  if (!queueUrl) {
    throw new Error('SQS Queue environment variable(s) not set');
  }
  await sendMessageToSqs(message, 'QueryGPT', queueUrl);
}

async function storeConversationInDynamoDB (conversationTableName: string, from: string, to: string, body: string, openAIResponse: string, conversationId: string): Promise<void> {
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
  } as DynamoDbParams
  await storeInDynamoDB(params);
}

export async function processRecord (record: Record, openai: OpenAIApi, conversationTableName: string, model: string, prompt: string): Promise<void> {
  const { conversationId, to, from, body } = JSON.parse(record.body) as Message;

  const messages = await fetchLatestMessages(from, conversationTableName, body, prompt, from, conversationId);
  console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history.`);
  console.log(`MESSAGES: ${JSON.stringify(messages)}`);

  const openAIResponse = await createChatCompletion(openai, messages, model);
  if (!openAIResponse) {
    return console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
  }
  console.log(`${conversationId} -- QueryGPT -- OpenAI Success.`);

  //Check if any of the last three assisant messages have a delimtier. If so, the image generation will be on cooldown. After that, we can send another.
  const imageOnCooldown = imageCooldownCheck(messages);
  let imagePrompt = openAIResponse.includes('<<<');
  let sqsMessage = openAIResponse;
  if (imagePrompt && imageOnCooldown) {
    imagePrompt = false;
    const {response} = delimiterProcessor(openAIResponse)
    sqsMessage = response;
    console.log(`Prompt detected, but image generation on cooldown.`);
  }
  await sendToSqs(conversationId, to, from, sqsMessage, imagePrompt);
  console.log(`${conversationId} -- QueryGPT -- Successfully placed on SQS queue.`);

  //After sending the message to SQS to continue to the user, store the conversation in DynamoDb
  await storeConversationInDynamoDB(conversationTableName, from, to, body, sqsMessage, conversationId);
}