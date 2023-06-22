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
        await sendMessageToSqs(message, 'QueryGPT', process.env.SEND_SMS_QUEUE_URL);
      } else {
        console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
      }
    } catch (error) {
      console.error(`${conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`);
      const errorMessage = {conversationId: conversationId, to: to, from: from, body: JSON.stringify(error)};
      await sendMessageToSqs( errorMessage, 'QueryGPT', process.env.ERROR_QUEUE_URL );
    }
  }
};
