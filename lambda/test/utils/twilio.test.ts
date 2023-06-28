import { parseTwilioEventValues, sendSms } from "../../utils/twilio.utils";
import { createResponse } from '../../utils/common.utils';

describe('parseTwilioEventValues', () => {
    it('should parse the Twilio event values from the request body', () => {
        const requestBody = 'Body=Test&To=%2B123456789&From=%2B198765432&MessageSid=123';
        const result = parseTwilioEventValues(requestBody);
        expect(result).toEqual({
            conversationId: '123',
            to: '+123456789',
            from: '+198765432',
            body: 'Test'
        });
    });

    it('should throw an error if required values are missing', () => {
        const requestBody = 'Body=Test&To=%2B123456789';
        expect(() => parseTwilioEventValues(requestBody)).toThrowError('ReceiveGPT -- Required values are missing in the request body.');
    });
});

describe('sendSms', () => {
    let consoleError: jest.SpyInstance;
    let consoleLog: jest.SpyInstance;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation();
        consoleLog = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleError.mockRestore();
        consoleLog.mockRestore();
    });

    it('should send an SMS successfully and log the message SID', async () => {
        const client = {
            messages: {
                create: jest.fn().mockResolvedValue({ sid: 'SM123' }),
            },
        };
        const response = await sendSms(client, '+123456789', '+198765432', 'Hello');
        expect(consoleLog).toHaveBeenCalled();
        expect(response).toEqual(createResponse(200, { message: 'Message sent successfully' }));
    });

    it('should log an error and return a 500 response when there is an issue sending the SMS', async () => {
        const client = {
            messages: {
                create: jest.fn().mockRejectedValue(new Error('Failed')),
            },
        };
        const response = await sendSms(client, '+123456789', '+198765432', 'Hello');
        expect(consoleError).toHaveBeenCalled();
        expect(response).toEqual(createResponse(500, { error: 'Failed to send message: Error: Failed' }));
    });
});
