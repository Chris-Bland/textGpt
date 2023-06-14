exports.handler = async (event) => {
    console.log(`sendSms -- event from QueryGPT sqs: ${JSON.stringify(event)}`);
    event.Records.forEach(record => {
      const { requestBody } = JSON.parse(record.body);
      console.log(`SendSms -- RequestBody from SQS: ${requestBody}`);
    });
  };
  