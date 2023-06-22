import twilio from 'twilio';
import  { getSecret } from './utils/secrets.util';

export const handler = async (event: { Records: any; }) => {
    try {
        const secrets = await getSecret('ChatGPTSecrets');
        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = secrets;
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        for (const record of event.Records) {
            const { conversationId, to, from } = JSON.parse(record.body);
            try {
                const message = await client.messages.create({
                    body: 'Unfortuntately we encountered an issue. Please try again. If this issue persists, please try again later.    --TextGPT',
                    from: to,
                    to: from
                });
                console.log(`${conversationId} -- ErrorSMS -- Message sent: ${message.sid}`);
            } catch (error) {
                console.error(`${conversationId} -- ErrorSMS -- Error during processing of record: ${error}`);
            }
        }
    } catch (error) {
        console.error(`ErrorSMS -- Error during Twilio setup: ${error}`);
        throw error;
    }
};
