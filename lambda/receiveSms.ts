import { SQS } from 'aws-sdk';
import  { sendMessageToSqs } from './utils/sqs.util';

const sqs = new SQS();


exports.handler = async (event: { body: any; }) => {
  console.log(` -- ReceiveSMS -- before: ${event.body}`);
  const message = parseStringValues(event.body)
  console.log(`${message.conversationId} -- ReceiveSMS -- After: ${message}`);
  try {
    if (!process.env.SEND_SMS_QUEUE_URL) {
      console.error(`${message.conversationId} -- ReceiveSMS -- SEND_SMS_QUEUE_URL environment variable is not set`);
      return;
    }
    await sendMessageToSqs( message, 'ReceiveSMS', process.env.SEND_SMS_QUEUE_URL );
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