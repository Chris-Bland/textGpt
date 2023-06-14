const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  const requestBody = event.body;

  const params = {
    MessageBody: JSON.stringify({requestBody}),
    QueueUrl: process.env.SMS_QUEUE_URL 
  };
  
  try {
    await sqs.sendMessage(params).promise();
    console.log(`ReceiveSMS -- Sent message to SQS: ${params}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully received message'
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
