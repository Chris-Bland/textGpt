import {SecretsManager} from 'aws-sdk';
import twilio from 'twilio';
import  { getSecret } from './utils/secrets.util';

const secretsManager = new SecretsManager();
export const handler = async (event: { Records: any; }) => {
    try {
        // Get secrets for Twilio call
        const secrets = await getSecret('ChatGPTSecrets');
        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets;
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        for (const record of event.Records) {
            const { conversationId, to, from, body } = JSON.parse(record.body);
            try {
                if (body) {
                    console.log(`${conversationId} -- SendSMS -- Sending message to Twilio`);
                    const message = await client.messages.create({
                        body: body + '    --TextGPT',
                        from: to,
                        to: from
                    });
                    console.log(`${conversationId} -- SendSMS -- Sending message to Twilio: ${message.sid}`);
                }
            } catch (error) {
                console.error(`${conversationId} -- SendSMS -- Error during processing record: ${error}`);
            }
        }
    } catch (error) {
        console.error(`Error during Twilio setup: ${error}`);
        throw error;
    }
};
