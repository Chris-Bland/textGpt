# TextGPT

TextGPT is a project that brings together modern Conversational AI and traditional Telephony. It serves as a bridge between the Twilio telephony system and OpenAI's ChatGPT model, allowing SMS messages to be processed and responded to by the AI.

The system is built using the AWS Cloud Development Kit (CDK) and consists of several AWS Lambdas, each serving a specific function:

1. **receiveSms:** This Lambda function is triggered when an SMS message is received. It parses the message and places it into an SQS queue for further processing.
2. **queryGpt:** This function retrieves messages from the SQS queue, builds a prompt, and sends the prompt to the ChatGPT model for processing. The AI response is then placed back into an SQS queue.
3. **sendSms:** This Lambda function retrieves the AI response from the SQS queue and sends it as a reply SMS message using the Twilio api.

## All logging can be found in AWS CloudWatch and adhears to the following format:
`Logging Level` `ConversationId` -- `Lambda` -- `Log Content` -- `Logged Parameters`

INFO	SMb1f9a545ebbc89d7669b438753a82a6c -- SendSMS -- Sending message to Twilio

(A conversationId will follow the same message as it progresses through TextGPT for easy troubleshooting"

## To change the OpenAI Model in use:
Currently, this demo is using the OpenAI `gpt-3.5-turbo` model. This has a perfect blend of functionality, speed, cost, and max token allowance.

To adjust the model used, consult the OpenAI model list, choose a model, and replace the model name in the `queryGpt` lambda.

![OpenAI Models Documentation](https://platform.openai.com/docs/models)

## Example Usage (Using the `gpt-3.5-turbo` model):
<img src="https://github.com/c-bland/textGpt/assets/27901095/066345ee-5190-48e5-97e4-5e292b26cc24" width="411" height="812">


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

