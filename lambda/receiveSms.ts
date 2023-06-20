const AWS = require('aws-sdk');
const sqs = new AWS.SQS();


exports.handler = async (event: { body: any; }) => {
  const requestBody = event.body;
  const { ...message } = parseStringValues(requestBody);

  const queueUrl = process.env.SMS_QUEUE_URL;

  if (!queueUrl) {
    console.error(`${message.conversationId} -- ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error:`${message.conversationId} -- ReceiveSMS -- Error: The SMS_QUEUE_URL environment variable is not set`

      }),
    };
  }

  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  };
  
  try {
    await sqs.sendMessage(params).promise();
    console.log(`${message.conversationId} -- ReceiveSMS -- Sent message to SQS: ${JSON.stringify(params)}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${message.conversationId} -- ReceiveSMS -- Successfully put message on queue: ${JSON.stringify(requestBody)}`
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
      return { conversationId, body, to, from };
}