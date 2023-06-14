const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  const requestBody = event.body;
    //clean data here
    //Get and send only Body, To, and From
    const testParams = new URLSearchParams(str);

    const body = testParams.get("Body");
    const to = testParams.get("To");
    const from = testParams.get("From");
    console.log(`ReceiveSMS -- Body: ${body}`);
    console.log(`ReceiveSMS -- To: ${JSON.stringify(to)}`);
    console.log(`ReceiveSMS -- From: ${JSON.stringify(from)}`);
  
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
