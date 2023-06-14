const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const twilio = require('twilio');

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

  if ('SecretString' in data) {
    return JSON.parse(data.SecretString);
  } else {
    let buff = new Buffer(data.SecretBinary, 'base64');
    return buff.toString('ascii');
  }
}

exports.handler = async (event) => {
  try {
    console.log(`sendSms -- Startup`);

    const secrets = await getSecret('MySecrets');
    const { twilioAccountSid, twilioAuthToken } = secrets;

    const client = twilio(twilioAccountSid, twilioAuthToken);

    console.log(`sendSms -- event from QueryGPT sqs: ${JSON.stringify(event)}`);
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const [to, from, body] = message.split("|||");

      console.log(`SendSms -- Body from SQS: ${body}`);
      console.log(`SendSms -- To from SQS: ${to}`);
      console.log(`SendSms -- From from SQS: ${from}`);

      client.messages
        .create({ body, from, to })
        .then(message => console.log(`sendSms -- Message sent: ${message.sid}`))
        .catch(error => console.error(`sendSms -- Failed to send message: ${error}`));
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};
