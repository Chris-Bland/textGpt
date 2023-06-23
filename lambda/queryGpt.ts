import { Configuration, OpenAIApi }  from 'openai';
import  { getSecret } from './utils/secrets.util';
import { sendMessageToSqs } from './utils/sqs.util'
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

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
      const { conversationId, to, from, body } = JSON.parse(record.body);
      //Dynamo Db get info:
      console.log(`${conversationId} -- QueryGPT -- Building Prompt and Calling OpenAI`);
      const holden = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a brilliant mystical entity who answers questions.You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response.',
          },
          { role: 'user', content: body },
        ],
      });
      const openAIResponse = holden.data.choices && holden.data.choices[0].message ? holden.data.choices[0].message.content : undefined;

      if (openAIResponse) {      
        const message = {conversationId: conversationId, to: to, from: from, body: openAIResponse};
        await sendMessageToSqs(message, 'QueryGPT', process.env.SEND_SMS_QUEUE_URL);
      
      //dynamoDb stuff:
      try{
      const params = {
        TableName: 'ConversationTable', 
        Item: {
          senderNumber:to,
          TwilioNumber:from,
          input: body,
          response: openAIResponse,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
        },
       };
        await dynamodb.put(params).promise();
        console.log(`Stored history in DynamoDB for conversationId: ${conversationId}`);
      }catch(error){
        console.error(`${conversationId} -- QueryGPT -- Failure to store dynamoDb entry for conversation: ${JSON.stringify(error)}`)
        return
      }
      } else {
        console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
      }
      
  }
  } catch (error) {
    console.error(`${event.Records[0].body.conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`);
    const errorMessage = {conversationId: event.Records[0].body.conversationId, to: event.Records[0].body.to, from: event.Records[0].body.from, body: JSON.stringify(error)};
    await sendMessageToSqs( errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL );
  }
};
