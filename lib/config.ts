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
  model: 'gpt-3.5-turbo',
  github: {
    GITHUB_OWNER: 'Chris-Bland',
    GITHUB_REPO: 'textGpt'
  }
}
