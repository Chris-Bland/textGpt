# TextGPT

TextGPT bridges the gap between telephony and Conversational AI by integrating the Twilio telephony system with OpenAI's ChatGPT model. It enables SMS messages to be processed and responded to by ChatGPT, providing an AI-driven conversational experience all built on a scaleable and easily deployable platform.

![textGptArch](https://github.com/Chris-Bland/textGpt/assets/27901095/697658a5-1745-4eee-8b05-9edb1f5427be)

## Features

- Send and Receive SMS messages via Twilio API.
- Process and respond to messages using OpenAI's API featuring a wealth of models (including GPT 3.5 turbo and GPT 4).
- Scalable and serverless architecture using AWS Lambda functions.
- Reliable message processing using Amazon SQS queues.
- Secure storage of sensitive data with AWS Secrets Manager.
- Detailed logging for monitoring and troubleshooting.

## System Components

TextGPT is built using the AWS Cloud Development Kit (CDK) and consists of several AWS Lambda functions, each serving a specific function:

1. **receiveSms**: Triggered when an SMS message is received. It parses the message and enqueues it into an SQS queue for further processing.

2. **queryGpt**: Retrieves messages from the SQS queue, constructs a prompt based on the message content, and sends the prompt to the ChatGPT model. The AI-generated response is then enqueued into a separate SQS queue for delivery.

3. **sendSms**: Retrieves the AI response from the SQS queue and sends it as an SMS reply using the Twilio API.

## Logging

All logging is done through AWS CloudWatch and follows the format:

`Logging Level` `ConversationId` -- `Lambda` -- `Log Content` -- `Logged Parameters`


Example:

INFO SMb1f9a545ebbc89d7669b438753a82a6c -- SendSMS -- Sending message to Twilio

The `ConversationId` is consistent across logs for the same message, making it easier to trace its progression through the system.

## Configuration

### Changing the OpenAI Model

By default, TextGPT uses the `gpt-3.5-turbo` model from OpenAI. To use a different model, visit the [OpenAI Models Documentation](https://platform.openai.com/docs/models) to select a model, and then update the model name in the `queryGpt` Lambda function.

## Getting Started

### Prerequisites

- AWS Account
- Twilio Account
- OpenAI Account
- Node.js and npm
- AWS CDK CLI

### Setup

#### Twilio

1. Sign up for a Twilio account and go to the console.
2. Obtain a phone number and take note of it.
3. Configure the Lambda webhook: In the Twilio console, navigate to Phone Numbers -> Manage -> Active Numbers. Under Messaging Configuration, find the "A message comes in" field and ensure it's set to "Webhook". Add your `receiveSms` Lambda URL to this field.

#### AWS

1. Create a secret in AWS Secrets Manager named `ChatGPTSecrets`.
2. Add the following key-value pairs to the secret: `twilioAccountSid`, `twilioAuthToken`, and `openAiApiKey`. Use the configuration values from the Twilio console forthe Twilio keys, and for OpenAI, generate a new secret API key in the account settings panel.
3. Ensure that the IAM policy for your Lambda functions includes permissions to access the secret. Make sure the resource ARN in the IAM policy matches the full ARN of the secret.

#### Infrastructure as Code (IAC)

1. You can toggle the timeout settings for the Lambda functions as needed in the `./lib/config.ts` file.
2. All the necessary IAM policies and roles are set up in the stack defined in `./lib/text_gpt-stack.ts`.

### Deployment

1. Clone the TextGPT repository to your local machine.
2. Navigate to the project directory and run `npm install` to install dependencies.
3. Build the CDK stack by running `cdk build`.
4. Deploy the stack to your AWS account by running `cdk deploy`. This command also creates the necessary resources in your AWS account.

## Monitoring and Troubleshooting

1. Monitor the logs in AWS CloudWatch for any issues or to trace the flow of messages.
2. If the Lambda functions are not able to access the secrets, verify that the IAM policy associated with the Lambda functions has the correct permissions and resource ARN.
3. Ensure that your Twilio webhook is correctly configured to point to the `receiveSms` Lambda function URL.

### Example Usage

![Example Usage](https://github.com/Chris-Bland/textGpt/assets/27901095/7d0a8123-8fec-4022-baaa-7789245acacc)

## Acknowledgments


- OpenAI for the ChatGPT model.
- AWS for the Cloud Development Kit (CDK) and Lambda services.
- Twilio for the telephony services.
  

