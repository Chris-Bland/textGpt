import { SQS, SecretsManager } from 'aws-sdk';
import { Configuration, OpenAIApi } from 'openai';

const sqs = new SQS();
const secretsManager = new SecretsManager();

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
        await sendMessageToSqs(conversationId, to, from, openAIResponse);
      } else {
        console.error(`${conversationId} -- QueryGPT -- No response from OpenAI`);
      }

    } catch (error) {
      console.error(`${conversationId} -- QueryGPT -- Error: ${JSON.stringify(error)}`);
    }
  }
};

async function getSecret(secretName: string): Promise<any> {
  try {
      const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

      if ('SecretString' in data && data.SecretString) {
        return JSON.parse(data.SecretString);
    } else if (data.SecretBinary) {
        let buff = Buffer.from(data.SecretBinary as ArrayBuffer);
        return buff.toString('ascii');
    } else {
        console.error('No SecretString or SecretBinary found in the secret');
        return null;
    }
  
  } catch (error) {
    console.error(`Error retrieving secret:`, error);
    return null;
  }
}

async function sendMessageToSqs(conversationId: string, to: string, from: string, openAIResponse: string): Promise<void>{
  if (!process.env.SEND_SMS_QUEUE_URL) {
    console.error('SEND_SMS_QUEUE_URL environment variable is not set');
    return;
  }

  const message = [conversationId, to, from, openAIResponse].join('|||');
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: process.env.SEND_SMS_QUEUE_URL,
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`${conversationId} -- QueryGPT -- Successfully put message on queue: ${JSON.stringify(params)}`);
  } catch (error) {
    console.error(`${conversationId} -- QueryGPT -- Error sending message to SQS: ${JSON.stringify(error)}`);
  }
}
