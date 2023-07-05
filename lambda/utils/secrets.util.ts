import { SecretsManager } from 'aws-sdk'

const secretsManager = new SecretsManager()

export async function getSecret (secretName: string): Promise<any> {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise()
    if ('SecretString' in data && data.SecretString) {
      return JSON.parse(data.SecretString)
    } else {
      console.error('No SecretString found in the secret')
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`)
    return null
  }
}
