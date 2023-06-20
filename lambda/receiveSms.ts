import { SQS } from 'aws-sdk';
import { sendMessageToSqs } from './utils/sqs.util'

const sqs = new SQS();


export const handler = async (event: { body: any; }) => {
  const queueUrl = process.env.SMS_QUEUE_URL;

  if (!queueUrl) {
    console.error(`ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:`ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`

      }),
    };
  }

  const message = parseStringValues(event.body)
  console.log(`${message.conversationId} -- ReceiveSMS -- After: ${message}`);
  try {
    await sendMessageToSqs( message, 'ReceiveSMS', queueUrl );
    console.log(`${message.conversationId} -- ReceiveSMS -- Sent message to SQS: ${JSON.stringify(message)}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${message.conversationId} -- ReceiveSMS -- Successfully put message on queue: ${JSON.stringify(event.body)}`
      }),
    };
  } catch (error) {
    console.error(`${message.conversationId} -- ReceiveSMS -- Failed to send message: ${error}`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `${message.conversationId} -- ReceiveSMS -- Failed to send message`
      }),
    };
  }
};

function parseStringValues(requestBody: string) {
  const parsedBody = new URLSearchParams(requestBody as string);
  const body = parsedBody.get("Body");
  const to = parsedBody.get("To");
  const from = parsedBody.get("From");
  const conversationId = parsedBody.get("MessageSid");
  if (!body || !to || !from || !conversationId) {
    throw new Error("Required values are missing in the request body.");
  }
  return {     
    conversationId: conversationId as string,
    to: to as string,
    from: from as string,
    body: body as string,
  };
}

