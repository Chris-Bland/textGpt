const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  event.Records.forEach(async (record) => {
    const { requestBody } = JSON.parse(record.body);
      
    console.log(`QueryGPT -- RequestBody from SQS: ${requestBody}`);

    const params = {
      MessageBody: `QUERY BODY: ${JSON.stringify({requestBody})}`,
      QueueUrl: process.env.SEND_SMS_QUEUE_URL 
    };
    
    try {
      await sqs.sendMessage(params).promise();
      console.log(`QueryGPT -- Sent message to SendSms SQS: ${params}`);
    } catch (error) {
      console.error(`QueryGPT -- Failed to send message: ${error}`);
    }
  });
};
