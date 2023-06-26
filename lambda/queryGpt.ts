import { Configuration, OpenAIApi }  from 'openai';
import  { getSecret } from './utils/secrets.util';
import { sendMessageToSqs } from './utils/sqs.util'
import { fetchLatestMessages } from './utils/dynamoDb.utils';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

interface QueryParams {
  TableName: string, 
  Item: {
    senderNumber: string,
    TwilioNumber: string,
    input: string,
    response: string,
    conversationId: string,
    timestamp: string
  },
}

export const handler = async (event: any): Promise<any> => {
  try{

  const secrets = await getSecret('ChatGPTSecrets');
  console.log(`GPT -- ${JSON.stringify(event.Records)}`)
  
  if (!secrets || !secrets.OPENAI_API_KEY) {
    console.error('QueryGPT -- Unable to retrieve OpenAI API Key from secrets');
  }

  const configuration = new Configuration({
    apiKey: secrets.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  for (const record of event.Records) {
    if(process.env.CONVERSATION_TABLE_NAME){
      const { conversationId, to, from, body } = JSON.parse(record.body);
      //Dynamo Db get info:
      const messages = await fetchLatestMessages(from, process.env.CONVERSATION_TABLE_NAME, body);
      console.log(`${conversationId} -- QueryGPT -- fetched dynamoDB history: ${JSON.stringify(messages)}`);

      const holden = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
      });
      const openAIResponse = holden.data.choices && holden.data.choices[0].message ? holden.data.choices[0].message.content : undefined;

      if (openAIResponse) {      
        const message = {conversationId: conversationId, to: to, from: from, body: openAIResponse};
        await sendMessageToSqs(message, 'QueryGPT', process.env.SEND_SMS_QUEUE_URL);
      
      //dynamoDb stuff:
      try{
      const params: QueryParams = {
        TableName: process.env.CONVERSATION_TABLE_NAME, 
        Item: {
          senderNumber: from,
          TwilioNumber:to,
          input: body,
          response: openAIResponse,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
        },
       };
        await dynamodb.put(params).promise();
        console.log(`Stored context in DynamoDB for conversationId: ${conversationId}`);
      }catch(error){
        console.error(`${conversationId} -- QueryGPT -- Failure to store dynamoDb entry for conversation: ${JSON.stringify(error)}`)
        return
      }
      } else {
        console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
      }
      
  }
}
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`);
    const errorMessage = {conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error)};
    await sendMessageToSqs( errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL );
  }
};
