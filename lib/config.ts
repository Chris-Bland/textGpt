export const envConfig = {
    receiveSms: {
        memorySize: 256,
        timeout: 10, // in seconds
        entry: './lambda/receiveSms.ts'
    },
    queryGpt: {
        memorySize: 1024,
        timeout: 30, // in seconds
        entry: './lambda/queryGpt.js',
        bundling: {
            nodeModules: ['openai']
        }
    },
    sendSms: {
        memorySize: 256,
        timeout: 10, // in seconds
        entry: './lambda/sendSms.js',
        bundling: {
            nodeModules: ['twilio']
        }
    }
}