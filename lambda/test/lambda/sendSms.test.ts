import { handler } from '../../sendSms';
import twilio from 'twilio';
import { getSecret } from '../../utils/secrets.util';
import { createResponse } from '../../utils/common.utils';
import { sendSms } from '../../utils/twilio.utils';

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {}; // return the mock implementation here
  });
});
jest.mock('../../utils/secrets.util');
jest.mock('../../utils/common.utils');
jest.mock('../../utils/twilio.utils');

const mockTwilio = twilio as jest.MockedFunction<typeof twilio>;
const mockGetSecret = getSecret as jest.MockedFunction<typeof getSecret>;
const mockCreateResponse = createResponse as jest.MockedFunction<typeof createResponse>;
const mockSendSms = sendSms as jest.MockedFunction<typeof sendSms>;

describe('sendSms Lambda Function', () => {
    beforeEach(() => {
      mockGetSecret.mockResolvedValue({
        TWILIO_ACCOUNT_SID: 'test_sid',
        TWILIO_AUTH_TOKEN: 'test_token',
      });
      mockSendSms.mockResolvedValue({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'default message' }),
      });
      mockCreateResponse.mockReturnValue({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'default message' }),
      });
    });
  
    it('should send SMS successfully', async () => {
      const event = {
        Records: [
          {
            body: JSON.stringify({
              conversationId: '12345',
              to: '1234567890',
              from: '0987654321',
              body: 'Test message',
              lambda: 'sendSms',
            }),
          },
        ],
      };
  
      const response = await handler(event);
  
      expect(response).toEqual({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'default message' }),
      });
    });
  
    it('should return error when SMS sending fails', async () => {
      mockSendSms.mockResolvedValueOnce({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' }),
      });
  
      const event = {
        Records: [
          {
            body: JSON.stringify({
              conversationId: '12345',
              to: '1234567890',
              from: '0987654321',
              body: 'Test message',
              lambda: 'sendSms',
            }),
          },
        ],
      };
  
      const response = await handler(event);
  
      expect(response).toEqual({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
  
    it('should return 404 when no records are found', async () => {
        mockCreateResponse.mockReturnValueOnce({
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No Records Found' }),
        });
        const event = { Records: [] };
      
        const response = await handler(event);
      
        expect(response).toEqual({
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No Records Found' }),
        });
      });
      
  
      it('should return 500 when an error occurs during Twilio setup', async () => {
        mockGetSecret.mockRejectedValueOnce(new Error('Twilio setup error'));
        mockCreateResponse.mockReturnValueOnce({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Error during Twilio setup: Twilio setup error' }),
        });
      
        const event = {
          Records: [
            {
              body: JSON.stringify({
                conversationId: '12345',
                to: '1234567890',
                from: '0987654321',
                body: 'Test message',
                lambda: 'sendSms',
              }),
            },
          ],
        };
      
        const response = await handler(event);
      
        expect(response).toEqual({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Error during Twilio setup: Twilio setup error' }),
        });
      });
  });