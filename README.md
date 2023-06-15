# TextGPT -- Bringing together modern Conversational AI and traditional Telephony 

This project uses Twilio for the telephony provider. AWS CDK for the IAC. AWS microservices for the processing. OpenAI for the conversational AI element.

All AWS recoures are created through Infrastructure as code and defined in the stack. IAM roles are also setup in the stack.

The queryGpt and sendSms lambas are bundled with their dependencies. 

Only the receiveSms lambda is setup through the ApiGateway.

## Setup:

### Twilio:
Sign up for a Twilio account and go to the console. 
Get a phone number (take note of it)
In the Twilio console, navigate to Phone Numbers -> Manage -> Active Numbers. 
Under Messaging Configuration, find the "A call comes in" field and ensure it's set to "Webhook".
Add your receiveSms lambda url to this field.

Find your AccountSid and AuthToken values and add them as the value for the twilioAccountSid and twilioAuthToken keys in AWS SecretsManager

### AWS:
Create a secret called `TextGptSecrets`. Add values for `twilioAccountSid`, `twilioAuthToken`, and `openAiApiKey`.
If you have issues with lambdas not being able to get secrets, make sure the IAM resource is the full secret name. Sometimes dropped the ending.

### IAC:
Toggle timeouts as needed. All IAM policies and Roles are setup in the stack.

## To run:

### npm install
### cdk build
### cdk deploy

