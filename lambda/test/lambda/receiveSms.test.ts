import { handler } from '../../receiveSms';
import { parseTwilioEventValues } from '../../utils/twilio.utils';
import { processMessage } from '../../utils/sqs.util';
import { createResponse } from '../../utils/common.utils';

jest.mock('../../utils/twilio.utils');
jest.mock('../../utils/sqs.util');
jest.mock('../../utils/common.utils');

const mockParseTwilioEventValues = parseTwilioEventValues as jest.MockedFunction<typeof parseTwilioEventValues>;
const mockProcessMessage = processMessage as jest.MockedFunction<typeof processMessage>;
const mockCreateResponse = createResponse as jest.MockedFunction<typeof createResponse>;

describe('receiveSms Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.SMS_QUEUE_URL = 'https://example.com/sqs';
  });

  it('should process the message successfully', async () => {
    mockParseTwilioEventValues.mockReturnValue({ conversationId: 'TEST1', body: 'Test message', from: '1234567890', to: '0987654321' });
    mockProcessMessage.mockResolvedValue( {statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Message processed successfully'})});
    mockCreateResponse.mockReturnValue({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Message processed successfully' }),
    });

    const event = { body: 'Test message' };

    const response = await handler(event);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Message processed successfully' }),
    });
  });

  it('should return 500 when SMS_QUEUE_URL environment variable is not set', async () => {
    delete process.env.SMS_QUEUE_URL;
    mockCreateResponse.mockReturnValue({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: SMS_QUEUE_URL environment variable is not set' }),
    });

    const event = { body: 'Test message' };

    const response = await handler(event);

    expect(response).toEqual({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: SMS_QUEUE_URL environment variable is not set' }),
    });
  });

  it('should return 400 for invalid request content', async () => {
    mockParseTwilioEventValues.mockImplementation(() => {
      throw new Error('Invalid content');
    });
    mockCreateResponse.mockReturnValue({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid Request Content: Invalid content' }),
    });

    const event = { body: 'Invalid content' };

    const response = await handler(event);

    expect(response).toEqual({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid Request Content: Invalid content' }),
    });
  });
});
