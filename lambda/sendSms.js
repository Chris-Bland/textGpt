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
    //get secrets for Twilio call
    const secrets = await getSecret('ChatGPTSecrets');
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets;

    //create client, parse to/from/body, send the text
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const [to, from, body] = message.split("|||");

      await client.messages
      .create({body: body, from: to, to: from})
      .then(message => console.log(message.sid));
    }
  } catch (error) {
    console.error("SendSMS -- " + error);
    throw error;
  }
};
