const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
// const utils = require('../bin/utils');

exports.handler = async (event) => {
  const requestBody = event.body;

  const params = {
    MessageBody: JSON.stringify(parseStringValues(requestBody)),
    QueueUrl: process.env.SMS_QUEUE_URL 
  };
  
  try {
    await sqs.sendMessage(params).promise();
    console.log(`ReceiveSMS -- Sent message to SQS: ${JSON.stringify(params)}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully put message on queue:  ${JSON.stringify(requestBody)}`
      }),
    };
  } catch (error) {
    console.error(`ReceiveSMS -- Failed to send message: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send message',
      }),
    };
  }
};


function parseStringValues(requestBody) {
    const parsedBody = new URLSearchParams(requestBody);
  
    const body = parsedBody.get("Body");
    const to = parsedBody.get("To");
    const from = parsedBody.get("From");
  console.log(`to: ${to} from: ${from}  body: ${body} -- `)
    return { body, to, from };
  }