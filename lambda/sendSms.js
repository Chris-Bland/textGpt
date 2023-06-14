console.log(`sendSms -- Startup`);
exports.handler = async (event) => {
    console.log(`sendSms -- event from QueryGPT sqs: ${JSON.stringify(event)}`);
    event.Records.forEach(record => {
      const message = JSON.parse(record.body);
      const [to, from, body] = message.split("|||");
      console.log(`SendSms -- Body from SQS: ${body}`);
      console.log(`SendSms -- To from SQS: ${to}`);
      console.log(`SendSms -- From from SQS: ${from}`);
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