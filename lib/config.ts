export const envConfig = {
  receiveSms: {
    memorySize: 256,
    timeout: 10,
    entry: './lambda/receiveSms.ts'
  },
  queryGpt: {
    memorySize: 1024,
    timeout: 30,
    entry: './lambda/queryGpt.ts',
    bundling: {
      nodeModules: ['openai']
    }
  },
  sendSms: {
    memorySize: 256,
    timeout: 10,
    entry: './lambda/sendSms.ts',
    bundling: {
      nodeModules: ['twilio']
    }
  },
  imageProcessor: {
    memorySize: 1024,
    timeout: 30,
    entry: './lambda/imageProcessor.ts',
    bundling: {
      nodeModules: ['openai']
    }
  },
  bucketName: 'GeneratedImageBucket',
  model: 'gpt-3.5-turbo',
  imageResolution: '512x512',
  testFromNumber: 'TEST123', 
  imageCooldown: '3',
  startDelimiter: '<<<',
  endDelimiter: '>>>',
  errorMessage: 'Unfortunately we encountered an issue. Please try again. If this issue persists, please try again later.',
  github: {
    GITHUB_OWNER: 'Chris-Bland',
    GITHUB_REPO: 'textGpt'
  }
}
