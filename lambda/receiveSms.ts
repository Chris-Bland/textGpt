const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

let conversationId;

exports.handler = async (event: { body: any; }) => {
  const requestBody = event.body;
  const { conversationId, ...message } = parseStringValues(requestBody);

  const queueUrl = process.env.SMS_QUEUE_URL;

  if (!queueUrl) {
    console.error(`${conversationId} -- ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:`${conversationId} -- ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`

      }),
    };
  }

  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  };
  
  try {
    await sqs.sendMessage(params).promise();
    console.log(`${conversationId} -- ReceiveSMS -- Sent message to SQS: ${JSON.stringify(params)}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${conversationId} -- ReceiveSMS -- Successfully put message on queue: ${JSON.stringify(requestBody)}`
      }),
    };
  } catch (error) {
    console.error(`${conversationId} -- ReceiveSMS -- Failed to send message: ${error}`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `${conversationId} -- ReceiveSMS -- Failed to send message`
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
      return { conversationId, body, to, from };
}