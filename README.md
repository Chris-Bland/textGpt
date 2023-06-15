# TextGPT -- Bringing together modern Conversational AI and traditional Telephony 

This project uses Twilio for the telephony provider. AWS CDK for the IAC. AWS microservices for the processing. GPT4 for the conversational AI

## Setup:

### Twilio:
Sign up for a Twilio account and go to the console. 
Get a phone number (take note of it)
In the Twilio console, navigate to Phone Numbers -> Manage -> Active Numbers. 
Under Messaging Configuration, find the "A call comes in" field and ensure it's set to "Webhook".
Add your receiveSms lambda url to this field.

Find your AccountSid and AuthToken values and add them as the value for the twilioAccountSid and twilioAuthToken keys in AWS SecretsManager

### AWS:
Create secrets for twilioAccountSid and twilioAuthToken. Take not of the Secret Name and replace in the stack.

### IAC:
