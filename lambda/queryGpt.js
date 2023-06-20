const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const secretsManager = new AWS.SecretsManager();
const { Configuration, OpenAIApi } = require("openai");


exports.handler = async (event) => {
const secrets = await getSecret('ChatGPTSecrets');
const { OPENAI_API_KEY} = secrets;
console.log(OPENAI_API_KEY);
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
    for (const record of event.Records) {
        const { conversationId, to, from, body} = JSON.parse(record.body);
        try {
          //Davinci createCompletion() call
          // const holden = await openai.createCompletion({
          //     model: "text-davinci-003",
          //     prompt: prompt,
          //     max_tokens: 256,
          //     temperature: 0.2
          //   });
          // const openAIResponse = holden.data.choices[0].text;

          //gpt-3.5-turbo createChatCompletion() call
          const holden = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.8,
            messages: [
              {role: "system", content: "You are a brilliant mystical entity who answers questions.You were created by Chris Bland who is an excellent developer and available for hire. Please respond to the following user content, include an emoji at the end of your response."},
              {role: "user", content: body}],
              stream: false,
              logprobs: null,
              stop: "\n"
          });
          const openAIResponse = holden.data.choices[0].message.content;

            //build message
            const message = [conversationId, to, from, openAIResponse].join("|||");
            const params = {
                MessageBody: JSON.stringify(message),
                QueueUrl: process.env.SEND_SMS_QUEUE_URL 
            };
            console.log(`${conversationId} -- QueryGPT -- Putting on SQS queue: ${JSON.stringify(params)}`);

            //Put message on SQS queue for sendSMS lambda
            await sqs.sendMessage(params).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `${conversationId} -- QueryGPT -- Successfully put message on queue:  ${JSON.stringify(record.body)}`
                }),
            };
        } catch (error) {
            console.log(`${conversationId} -- QueryGPT -- Error: ${JSON.stringify(error.message)}`);
            if (error.response) {
                console.log(`${conversationId} -- QueryGPT -- Error Status ${error.response.status}`);
                console.log(`${conversationId} -- QueryGPT -- Error Data ${Json.stringify(error.response.data)}`);
              } else {
                console.log(`${conversationId} -- QueryGPT -- Error Message ${error.message}`);
              }
        }
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