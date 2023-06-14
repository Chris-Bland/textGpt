console.log(`sendSms -- Startup`);
exports.handler = async (event) => {
    console.log(`sendSms -- event from QueryGPT sqs: ${JSON.stringify(event)}`);
    event.Records.forEach(record => {
      const { requestBody } = JSON.parse(record.body);
      console.log(`SendSms -- RequestBody from SQS: ${requestBody}`);
    });
  };
  
  /*
  // Twilio
const accountSid = "";
const authToken = "";
const client = require("twilio")(accountSid, authToken);
client.messages
  .create({ body: "Hello from Twilio", from: "+{Twilio-Number}", to: "+{your number}" })
    .then(message => console.log(message.sid));


  */