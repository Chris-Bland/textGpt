# TextGPT

TextGPT is a project that brings together modern Conversational AI and traditional Telephony. It serves as a bridge between the Twilio telephony system and OpenAI's ChatGPT model, allowing SMS messages to be processed and responded to by the AI.

The system is built using the AWS Cloud Development Kit (CDK) and consists of several AWS Lambdas, each serving a specific function:

1. **receiveSms:** This Lambda function is triggered when an SMS message is received. It parses the message and places it into an SQS queue for further processing.
2. **queryGpt:** This function retrieves messages from the SQS queue and sends the content of the SMS to the ChatGPT model for processing. The AI response is then placed back into an SQS queue.
3. **sendSms:** This Lambda function retrieves the AI response from the SQS queue and sends it as a reply SMS message.



## Example Usage (Using the "text-davinci-003" model):
<img width="711" alt="Screenshot 2023-06-15 at 3 56 29 PM" src="https://github.com/c-bland/textGpt/assets/27901095/88c3a5ab-372c-4b25-a554-462aed4fa4b5">

## Current Architecture:

![textGptArch](https://github.com/c-bland/textGpt/assets/27901095/ddfa85dd-caa7-4e3c-8dc5-c164ac19e9ae)

## Setup:

### Twilio:
1. Sign up for a Twilio account and go to the console. 
2. Get a phone number (take note of it)
3. **Add lambda webhook:** In the Twilio console, navigate to Phone Numbers -> Manage -> Active Numbers. Under Messaging Configuration, find the "A call comes in" field and ensure it's set to "Webhook". Add your receiveSms lambda url to this field.

### AWS:
1. Create a secret called `ChatGPTSecrets`. 
2. Add values for `twilioAccountSid`, `twilioAuthToken`, and `openAiApiKey` using the twilio config values from the console. For OpenAI, generate a new secretApiKey in the account settings panel.
3. If you have issues with lambdas not being able to get secrets, make sure the IAM resource is the full secret name. Sometimes dropped the ending.

### IAC:
1. Toggle timeouts as needed. 
2. All IAM policies and Roles are setup in the stack.

## To run:
### npm install
### cdk build
### cdk deploy

