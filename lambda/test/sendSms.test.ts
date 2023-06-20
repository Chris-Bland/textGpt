import { handler } from '../sendSms';
import twilio from 'twilio';
import { getSecret } from '../utils/secrets.util';

// Mocking AWS SecretsManager
jest.mock('aws-sdk', () => {
    return {
        SecretsManager: jest.fn(() => ({
            getSecretValue: jest.fn(),
        })),
    };
});

// Mocking Twilio
jest.mock('twilio', () => {
    return jest.fn(() => ({
        messages: {
            create: jest.fn(),
        },
    }));
});

// Mocking getSecret utility function
jest.mock('../utils/secrets.util', () => ({
    getSecret: jest.fn(),
}));

describe('sendSmsLambda', () => {
    let mockTwilioClient: any;
    let mockGetSecret: jest.Mock;

    beforeEach(() => {
        mockTwilioClient = {
            messages: {
                create: jest.fn().mockResolvedValue({ sid: 'mock_sid' })
            }
        };
        (twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);
    
        mockGetSecret = getSecret as jest.Mock;
        mockGetSecret.mockResolvedValue({
            TWILIO_ACCOUNT_SID: 'test_account_sid',
            TWILIO_AUTH_TOKEN: 'test_auth_token'
        });
    });
    
    

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send SMS messages using Twilio', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        conversationId: '123',
                        to: '+1234567890',
                        from: '+0987654321',
                        Body: 'Hello, this is a test message',
                    }),
                },
            ],
        };
    
        try {
            await handler(event);
        } catch (error) {
            console.error('Error:', error);
        }
    
        console.log('mockGetSecret calls:', mockGetSecret.mock.calls);
        console.log('mockTwilioClient.messages.create calls:', mockTwilioClient.messages.create.mock.calls);
    
        expect(mockGetSecret).toBeCalledTimes(1);
        expect(mockTwilioClient.messages.create).toBeCalledWith({
            body: 'Hello, this is a test message    --TextGPT',
            from: '+1234567890',
            to: '+0987654321',
        });
    });
    

    it('should handle errors gracefully', async () => {
        mockGetSecret.mockRejectedValue(new Error('Test error'));

        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        conversationId: '123',
                        to: '+1234567890',
                        from: '+0987654321',
                        body: 'Hello, this is a test message',
                    }),
                },
            ],
        };
        
        await expect(handler(event)).rejects.toThrow('Test error');
    });
});
