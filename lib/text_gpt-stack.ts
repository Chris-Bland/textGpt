import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TextGptStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Lambdas:
    const receiveSms = new lambda.Function(this, 'ReceiveSmsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'receiveSms.handler'
    });

    const sendSms = new lambda.Function(this, 'SendSmsHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'sendSms.handler'
    });

    const queryGpt = new lambda.Function(this, 'QueryGptHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'queryGpt.handler'
    });   


  // Grant receiveSms invoke permissions for queryGpt
    queryGpt.grantInvoke(receiveSms);
    receiveSms.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [queryGpt.functionArn] 
    }));

    //API Gateway for receive. send/query do not need
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: receiveSms
    });

  }
}