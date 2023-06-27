import { parseTwilioEventValues } from './utils/twilio.utils';
import { processMessage } from './utils/sqs.util';
import { createResponse } from './utils/common.utils';
import { sendMessageToSqs } from './utils/sqs.util';

export const handler = async (event: { body: any }) => {
  try {
    ////
    const messageTest= {
      conversationId: 'test',
      to: 'TEST123',
      from: 'TEST123',
      body: 'TEST123',
  }
    await sendMessageToSqs(messageTest, 'ReceiveSMS', process.env.ERROR_QUEUE_URL);
    console.log(`Twilio Content: ${JSON.stringify(event)}`);
    const message = parseTwilioEventValues(event.body);
    
    // Check if SMS_QUEUE_URL is defined
    if (!process.env.SMS_QUEUE_URL) {
      throw new Error('SMS_QUEUE_URL environment variable is not set');
    }
    
    // Process the message, place it on the SQS queue, and return the response
    return await processMessage(message, process.env.SMS_QUEUE_URL);
    
  } catch (error: unknown) {
    console.log(`ReceiveSms -- Error: ${error}`)
    if (error instanceof Error) {
      // Check if the error is due to a missing environment variable
      if (error.message === 'SMS_QUEUE_URL environment variable is not set') {
        return createResponse(500, { error: `Server configuration error: ${error.message}` });
      }
    }
    // Default case for other errors
    return createResponse(400, { error: `Invalid Request Content: ${error}` });
  }
};