import * as cdk from 'aws-cdk-lib';
// import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';



export class TextGptStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
//Lambdas:
    const receiveSms = new lambda.Function(this, 'ReceiveSmsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'receiveSms.handler'
    });

    const sendSms = new NodejsFunction(this, 'SendSmsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      entry: './lambda/sendSms.js', 
      handler: 'handler',
      bundling: {
        nodeModules: ['twilio'], 
      },
    });

    const queryGpt = new lambda.Function(this, 'QueryGptHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'queryGpt.handler',
    });

//Secrets:
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecret', 'prod/twilio');
    
    sendSms.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [secret.secretArn],
    }));

//SQS
    const receiveSmsQueue = new sqs.Queue(this, 'ReceiveSmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30) // Adjust as needed
    });
    const sendSmsQueue = new sqs.Queue(this, 'SendSmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30) // Adjust as needed
    });

// Set up the environment variables for the receiveSms and queryGpt functions
    receiveSms.addEnvironment('SMS_QUEUE_URL', receiveSmsQueue.queueUrl);
    queryGpt.addEnvironment('SMS_QUEUE_URL', receiveSmsQueue.queueUrl);
    queryGpt.addEnvironment('SEND_SMS_QUEUE_URL', sendSmsQueue.queueUrl);
    sendSms.addEnvironment('SEND_SMS_QUEUE_URL', sendSmsQueue.queueUrl);

// Allow the receiveSms and queryGpt functions to send messages to their respective queues
    receiveSmsQueue.grantSendMessages(receiveSms);
    sendSmsQueue.grantSendMessages(queryGpt);

// Set up the event source mappings for the queryGpt and sendSms functions
    queryGpt.addEventSource(new lambdaEventSources.SqsEventSource(receiveSmsQueue));
    sendSms.addEventSource(new lambdaEventSources.SqsEventSource(sendSmsQueue));

//API Gateway for receive. send/query do not need
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: receiveSms
    });
  }
}
