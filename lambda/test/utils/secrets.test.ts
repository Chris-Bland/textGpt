import { SecretsManager } from 'aws-sdk';
import { getSecret } from '../../utils/secrets.util'; 

jest.mock('aws-sdk', () => {
  const mockGetSecretValue = jest.fn();
  return {
    SecretsManager: jest.fn(() => {
      return { getSecretValue: mockGetSecretValue };
    }),
  };
});

describe('getSecret', () => {
  let secretsManager: {
    getSecretValue: jest.Mock;
  };

  beforeEach(() => {
    secretsManager = {
      getSecretValue: jest.fn(),
    };
  
    secretsManager.getSecretValue.mockClear();
    console.error = jest.fn();
  });

  it('should retrieve secret successfully with SecretString', async () => {
    secretsManager.getSecretValue.mockResolvedValue({
      SecretString: JSON.stringify({ key: 'value' }),
    });

    const secret = await getSecret('secretName');
    expect(secret).toEqual({ key: 'value' });
  });

  it('should retrieve secret successfully with SecretBinary', async () => {
    const buffer = Buffer.from('binarySecret', 'ascii');
    secretsManager.getSecretValue.mockResolvedValue({
      SecretBinary: buffer.buffer as ArrayBuffer,
    });

    const secret = await getSecret('secretName');
    expect(secret).toEqual('binarySecret');
  });

  it('should handle no SecretString or SecretBinary in the secret', async () => {
    secretsManager.getSecretValue.mockResolvedValue({
      promise: jest.fn().mockResolvedValue({testData: 'test'}),
    });
  
    const secret = await getSecret('secretName');
    expect(console.error).toHaveBeenCalledWith(
      'No SecretString or SecretBinary found in the secret'
    );
    expect(secret).toBe(null);
  });
  

  it('should handle error in retrieving secret', async () => {
    secretsManager.getSecretValue.mockRejectedValue({
        promise: jest.fn().mockRejectedValue(new Error('Error retrieving secret')),
      });
    const secret = await getSecret('secretName');
    expect(console.error).toHaveBeenCalledWith("Error retrieving secret: TypeError: Cannot read properties of undefined (reading 'promise')");
    expect(secret).toBe(null);
  });
});
