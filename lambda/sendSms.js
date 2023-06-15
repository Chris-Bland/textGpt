const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const twilio = require('twilio');

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  console.log(`sendSms -- DATA: ${JSON.stringify(data)}`);

  if ('SecretString' in data) {
    return JSON.parse(data.SecretString);
  } else {
    let buff = new Buffer(data.SecretBinary, 'base64');
    return buff.toString('ascii');
  }
}

exports.handler = async (event) => {
  try {
    console.log(`sendSms -- Calling Secrets Manager`);
    const secrets = await getSecret('ChatGPTSecrets');
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets;
    console.log(`sendSms -- tokens: ${JSON.stringify(TWILIO_ACCOUNT_SID)}`);
    console.log(`sendSms -- tokens: ${JSON.stringify(TWILIO_AUTH_TOKEN)}`);

  //   const client = twilio(accountSid, authToken);
  //   console.log(`sendSms -- tokens: ${JSON.stringify(client)}`);
  //   console.log(`sendSms -- event from QueryGPT sqs: ${JSON.stringify(event)}`);
  //   for (const record of event.Records) {
  //     const message = JSON.parse(record.body);
  //     const [to, from, body] = message.split("|||");
  //     console.log(`SendSms -- Body from SQS: ${body}`);

  //     client.messages
  //       .create({ body, from, to })
  //       .then(message => console.log(`sendSms -- Message sent: ${message.sid}`))
  //       .catch(error => console.error(`sendSms -- Failed to send message: ${error}`));
  //   }
  } catch (error) {
    console.error("SendSMS -- " + error);
    throw error;
  }
};
