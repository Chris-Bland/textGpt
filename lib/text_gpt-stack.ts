import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { envConfig } from './config';

type CustomNodejsFunctionOptions = {
  memorySize: number;
  timeout: number;
  entry: string;
  bundling?: {
      nodeModules: string[];
  };
};

export class TextGptStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Lambdas
        const receiveSms = this.createLambdaFunction('ReceiveSmsHandler', envConfig.receiveSms);
        const queryGpt = this.createLambdaFunction('QueryGptHandler', envConfig.queryGpt);
        const sendSms = this.createLambdaFunction('SendSmsHandler', envConfig.sendSms);
        const errorSms = this.createLambdaFunction('ErrorSmsHandler', envConfig.errorSms);

        // Secrets
        const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecret', 'ChatGPTSecrets');
        const lambdas = [sendSms, queryGpt, errorSms];
        for (const lambda of lambdas) {
            lambda.addToRolePolicy(new iam.PolicyStatement({
                actions: ['secretsmanager:GetSecretValue'],
                resources: [secret.secretArn],
            }));
        }

        // SQS
        const receiveSmsQueue = new sqs.Queue(this, 'ReceiveSmsQueue', {
            visibilityTimeout: cdk.Duration.seconds(30)
        });
        const sendSmsQueue = new sqs.Queue(this, 'SendSmsQueue', {
            visibilityTimeout: cdk.Duration.seconds(30)
        });
        const errorSmsQueue = new sqs.Queue(this, 'ErrorSmsQueue', {
            visibilityTimeout: cdk.Duration.seconds(30)
        });

        // DynamoDB
        const conversationTable = new dynamodb.Table(this, 'ConversationTable', {
            partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        // Environment Variables
        receiveSms.addEnvironment('SMS_QUEUE_URL', receiveSmsQueue.queueUrl);
        receiveSms.addEnvironment('ERROR_QUEUE_URL', errorSmsQueue.queueUrl);
        queryGpt.addEnvironment('SMS_QUEUE_URL', receiveSmsQueue.queueUrl);
        queryGpt.addEnvironment('SEND_SMS_QUEUE_URL', sendSmsQueue.queueUrl);
        queryGpt.addEnvironment('ERROR_QUEUE_URL', errorSmsQueue.queueUrl);
        sendSms.addEnvironment('SEND_SMS_QUEUE_URL', sendSmsQueue.queueUrl);
        sendSms.addEnvironment('ERROR_QUEUE_URL', errorSmsQueue.queueUrl);
        errorSms.addEnvironment('ERROR_QUEUE_URL', errorSmsQueue.queueUrl);

        // Permissions
        receiveSmsQueue.grantSendMessages(receiveSms);
        sendSmsQueue.grantSendMessages(queryGpt);
        errorSmsQueue.grantSendMessages(receiveSms);
        errorSmsQueue.grantSendMessages(queryGpt);
        errorSmsQueue.grantSendMessages(sendSms);
        conversationTable.grantReadWriteData(queryGpt);


        // Event Sources
        queryGpt.addEventSource(new lambdaEventSources.SqsEventSource(receiveSmsQueue));
        sendSms.addEventSource(new lambdaEventSources.SqsEventSource(sendSmsQueue));
        errorSms.addEventSource(new lambdaEventSources.SqsEventSource(errorSmsQueue));

        // API Gateway
        new apigw.LambdaRestApi(this, 'Endpoint', {handler: receiveSms});
    }

    private createLambdaFunction(id: string, options: CustomNodejsFunctionOptions) {
      return new NodejsFunction(this, id, {
          ...options,
          timeout: cdk.Duration.seconds(options.timeout),
          runtime: lambda.Runtime.NODEJS_16_X,
          architecture: lambda.Architecture.ARM_64, //remove if not on M series Mac
          //architecture: lambda.Architecture.X86_64,
          handler: 'handler',
      });
    }
  
}
