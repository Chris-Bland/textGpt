import { SQS } from 'aws-sdk';
import { createResponse } from './common.utils';

const sqs = new SQS();

export const sendMessageToSqs = async (message: { conversationId: string, to: string, from: string, body: string, [key: string]: any }, lambda: string, queueUrl: string | undefined): Promise<void> => {
  if (!queueUrl) {
    console.error('ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set');
    return;
  }
  message.lambda = lambda;

  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`${message.conversationId} -- ${lambda} -- Successfully put message on queue: ${JSON.stringify(params)}`);
  } catch (error) {
    console.error(`${message.conversationId} -- ${lambda} -- Error sending message to SQS: ${JSON.stringify(error)}`);
  }
};

export const processMessage = async (message: any, queueUrl: string) => {
  try {
    await sendMessageToSqs(message, 'ReceiveSMS', queueUrl);
    return createResponse(200, { message: `Success! ConversationID: ${message.conversationId}.` });
  } catch (error) {
    await sendMessageToSqs(message, 'ReceiveSMS', process.env.ERROR_QUEUE_URL);
    return createResponse(500, { error: `Failed to send message: ${error}` });
  }
};
