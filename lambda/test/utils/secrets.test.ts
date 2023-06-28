import { getSecret } from '../../utils/secrets.util';

const baseResponse = {
    ARN: 'x',
    Name: 'test_creds',
    VersionId: 'x',
    VersionStages: ['x'],
    CreatedDate: 'x'
  };
  
  jest.mock('aws-sdk', () => {
    return {
      config: {
        update(val: any) {},
      },
      SecretsManager: function () {
        return {
          getSecretValue: jest.fn(({ SecretId }: { SecretId: string }) => {
            if (SecretId === 'testSid') {
              return {
                promise: function () {
                  return { ...baseResponse, SecretString: '{"testSid":"test123"}' };
                },
              };
            } else if (SecretId === 'errorCase') {
              throw new Error('Error calling SecretsManager');
            } else {
              return {
                promise: function () {
                  return { ...baseResponse };
                },
              };
            }
          }),
        };
      },
    };
  });
  

describe('getSecret', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });

  it('should retrieve secret successfully with SecretString', async () => {
    const secret = await getSecret('testSid');
    expect(secret).toEqual({ testSid: 'test123' });
  });

  it('should handle no SecretString in the secret', async () => {
    const secret = await getSecret('noSecretString');
    expect(console.error).toHaveBeenCalledWith('No SecretString found in the secret');
    expect(secret).toBe(null);
  });

  it('should handle error in retrieving secret', async () => {
    const secret = await getSecret('errorCase');
    expect(console.error).toHaveBeenCalledWith(
      'Error retrieving secret: Error: Error calling SecretsManager'
    );
    expect(secret).toBe(null);
  });
});
