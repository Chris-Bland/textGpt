import { SecretsManager } from 'aws-sdk'

const secretsManager = new SecretsManager()

export async function getSecret (secretName: string): Promise<any> {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise()
    console.log(`data: ${data}`);
    if ('SecretString' in data && data.SecretString) {
      return JSON.parse(data.SecretString)
    } else if (data.SecretBinary) {
      const buff = Buffer.from(data.SecretBinary as ArrayBuffer)
      return buff.toString('ascii')
    } else {
      console.error('No SecretString or SecretBinary found in the secret')
    }
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`)
    return null
  }
}
