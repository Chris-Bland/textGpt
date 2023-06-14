const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  const requestBody = event.body;
  console.log(`ReceiveSMS -- RequestBody: ${JSON.stringify(requestBody)}`);
  const params = {
    MessageBody: JSON.stringify({requestBody}),
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
