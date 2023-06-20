import { Configuration, OpenAIApi }  from 'openai';
import  { getSecret } from './utils/secrets.util';
import { sendMessageToSqs } from './utils/sqs.util'

export const handler = async (event: any): Promise<any> => {
  const secrets = await getSecret('ChatGPTSecrets');
  
  if (!secrets || !secrets.OPENAI_API_KEY) {
    console.error('Unable to retrieve OpenAI API Key from secrets');
    return;
  }

  const configuration = new Configuration({
    apiKey: secrets.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const queueUrl = process.env.SEND_SMS_QUEUE_URL;

  if (!queueUrl) {
    console.error(`QueryGPT -- Error: The SEND_SMS_QUEUE_URL environment variable is not set`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:`QueryGPT -- Error: The SEND_SMS_QUEUE_URL environment variable is not set`

      }),
    };
  }
  for (const record of event.Records) {
    const { conversationId, to, from, body } = JSON.parse(record.body);
    try {
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
        await sendMessageToSqs(message, 'QueryGPT', queueUrl);
      } else {
        console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
      }

    } catch (error) {
      console.error(`${conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`);
    }
  }
};
