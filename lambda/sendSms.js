exports.handler = async (event) => {
    event.Records.forEach(record => {
      const { requestBody } = JSON.parse(record.body);
      console.log(`SendSms -- RequestBody from SQS: ${requestBody}`);
    });
  };
  