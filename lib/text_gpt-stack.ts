import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3';

import { envConfig } from './config'
import { SMS_QUEUE_URL, CONVERSATION_TABLE_NAME, SEND_SMS_QUEUE_URL, ERROR_QUEUE_URL, ERROR_QUEUE_ARN, MODEL, IMAGE_PROCESSOR_QUEUE_URL, IMAGE_RESOLUTION, ERROR_MESSAGE } from './text-gpt.constants'


interface CustomNodejsFunctionOptions {
  memorySize: number
  timeout: number
  entry: string
  bundling?: {
    nodeModules: string[]
  }
}

export class TextGptStack extends cdk.Stack {
  constructor (scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Lambdas
    const receiveSms = this.createLambdaFunction('ReceiveSmsHandler', envConfig.receiveSms)
    const queryGpt = this.createLambdaFunction('QueryGptHandler', envConfig.queryGpt)
    const sendSms = this.createLambdaFunction('SendSmsHandler', envConfig.sendSms)
    const imageProcessor = this.createLambdaFunction('ImageProcessorHandler', envConfig.imageProcessor)

    // S3
    const bucket = new s3.Bucket(this, envConfig.bucketName, {
      versioned: false,
    });
    bucket.grantWrite(imageProcessor);
    imageProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:*'],
      resources: [bucket.bucketArn + '/*'],
    }));

    // Secrets
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecret', 'ChatGPTSecrets')
    const lambdas = [sendSms, queryGpt, imageProcessor]
    for (const lambda of lambdas) {
      lambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [secret.secretArn]
      }))
    }

    // SQS
    const receiveSmsQueue = new sqs.Queue(this, 'ReceiveSmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    })
    const sendSmsQueue = new sqs.Queue(this, 'SendSmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    })
    const errorSmsQueue = new sqs.Queue(this, 'ErrorSmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    })
    const imageProcessorQueue = new sqs.Queue(this, 'ImageProcessorQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    })

    // DynamoDB
    const conversationTable = new dynamodb.Table(this, 'ConversationTable', {
      partitionKey: { name: 'senderNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    })

    // Environment Variables
    receiveSms.addEnvironment(SMS_QUEUE_URL, receiveSmsQueue.queueUrl)
    receiveSms.addEnvironment(ERROR_QUEUE_URL, errorSmsQueue.queueUrl)
    queryGpt.addEnvironment(SMS_QUEUE_URL, receiveSmsQueue.queueUrl)
    queryGpt.addEnvironment(SEND_SMS_QUEUE_URL, sendSmsQueue.queueUrl)
    queryGpt.addEnvironment(ERROR_QUEUE_URL, errorSmsQueue.queueUrl)
    queryGpt.addEnvironment(CONVERSATION_TABLE_NAME, conversationTable.tableName)
    queryGpt.addEnvironment(MODEL, envConfig.model)
    queryGpt.addEnvironment(IMAGE_PROCESSOR_QUEUE_URL, imageProcessorQueue.queueUrl)
    sendSms.addEnvironment(SEND_SMS_QUEUE_URL, sendSmsQueue.queueUrl)
    sendSms.addEnvironment(ERROR_QUEUE_URL, errorSmsQueue.queueUrl)
    sendSms.addEnvironment(ERROR_QUEUE_ARN, errorSmsQueue.queueArn)
    sendSms.addEnvironment(ERROR_MESSAGE, envConfig.errorMessage)
    imageProcessor.addEnvironment(ERROR_QUEUE_URL, errorSmsQueue.queueUrl)
    imageProcessor.addEnvironment(SEND_SMS_QUEUE_URL, sendSmsQueue.queueUrl)
    imageProcessor.addEnvironment(IMAGE_RESOLUTION, envConfig.imageResolution)

    // Permissions
    receiveSmsQueue.grantSendMessages(receiveSms)
    sendSmsQueue.grantSendMessages(queryGpt)
    sendSmsQueue.grantSendMessages(imageProcessor)
    errorSmsQueue.grantSendMessages(receiveSms)
    errorSmsQueue.grantSendMessages(queryGpt)
    errorSmsQueue.grantSendMessages(sendSms)
    errorSmsQueue.grantSendMessages(imageProcessor)
    imageProcessorQueue.grantSendMessages(queryGpt)
    conversationTable.grantReadWriteData(queryGpt)

    // Event Sources
    queryGpt.addEventSource(new lambdaEventSources.SqsEventSource(receiveSmsQueue))
    sendSms.addEventSource(new lambdaEventSources.SqsEventSource(sendSmsQueue))
    sendSms.addEventSource(new lambdaEventSources.SqsEventSource(errorSmsQueue))
    imageProcessor.addEventSource(new lambdaEventSources.SqsEventSource(imageProcessorQueue))

    // API Gateway
    new apigw.LambdaRestApi(this, 'Endpoint', { handler: receiveSms })
  }

  private createLambdaFunction (id: string, options: CustomNodejsFunctionOptions) {
    return new NodejsFunction(this, id, {
      ...options,
      timeout: cdk.Duration.seconds(options.timeout),
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64, // remove if not on M series Mac
      // architecture: lambda.Architecture.X86_64,
      handler: 'handler'
    })
  }
}
