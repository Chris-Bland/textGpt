import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';


export class TextGptStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the SQS queue
    const smsQueue = new sqs.Queue(this, 'SmsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30) // Adjust as needed
    });

    // Lambdas:
    const receiveSms = new lambda.Function(this, 'ReceiveSmsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'receiveSms.handler',
      environment: {
        SMS_QUEUE_URL: smsQueue.queueUrl // Pass the SQS queue URL as an environment variable
      }
    });

    // Grant receiveSms permissions to send messages to the SQS queue
    receiveSms.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [smsQueue.queueArn]
    }));

    const queryGpt = new lambda.Function(this, 'QueryGptHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'queryGpt.handler'
    });

    // Add the SQS queue as an event source for queryGpt
    queryGpt.addEventSource(new lambdaEventSources.SqsEventSource(smsQueue));

    // Grant queryGpt permissions to receive messages from the SQS queue
    queryGpt.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      resources: [smsQueue.queueArn]
    }));

    // API Gateway for receive
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: receiveSms
    });
  }
}
