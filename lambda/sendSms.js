const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const twilio = require('twilio');

exports.handler = async (event) => {
  try {
    //get secrets for Twilio call
    const secrets = await getSecret('ChatGPTSecrets');
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const [conversationId, to, from, body] = message.split("|||");
      if (body){
      console.log(`${conversationId} -- SendSMS -- Sending message to Twilio}`);
      await client.messages
      .create({body: body+'    --TextGPT', from: to, to: from})
      .then(message => console.log(message.sid));
    } 
    }
  } catch (error) {
    console.error(`${conversationId} -- SendSMS -- Error during Twilio message.create: ${error}`);
    throw error;
  }
};

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  if ('SecretString' in data) {
    return JSON.parse(data.SecretString);
  } else {
    let buff = new Buffer(data.SecretBinary, 'base64');
    return buff.toString('ascii');
  }
}
