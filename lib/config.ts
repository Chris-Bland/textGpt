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
        entry: './lambda/sendSms.js',
        bundling: {
            nodeModules: ['twilio']
        }
    }
}