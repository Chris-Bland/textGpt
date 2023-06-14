const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
console.log(`ReceiveSMS Lambda -- request: ${JSON.stringify(event, undefined, 2)}`);
  const params = {
    FunctionName: 'QueryGptHandler',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(event),
  };

  try {
    const response = await lambda.invoke(params).promise();
    const responseData = JSON.parse(response.Payload);
    console.log(`Response Data from Query: ${responseData}`);
  } catch (err) {
    console.error(`Receive Failed because: ${err}`);
    throw err;
  }
};
