import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { App } from 'aws-cdk-lib';
import { TextGptStack } from '../lib/text_gpt-stack';

test('Test TextGptStack has three SQS Queues with specific names', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');

  // Assert that the specific SQS queues are present
  expectCDK(stack).to(haveResource('AWS::SQS::Queue', {
    QueueName: 'ReceiveSmsQueue',
  }));
  expectCDK(stack).to(haveResource('AWS::SQS::Queue', {
    QueueName: 'SendSmsQueue',
  }));
  expectCDK(stack).to(haveResource('AWS::SQS::Queue', {
    QueueName: 'ErrorSmsQueue',
  }));
});

test('Test TextGptStack has Lambda Functions with specific names', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');

  // Assert that the specific Lambda functions are present
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    FunctionName: 'ReceiveSmsHandler',
  }));
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    FunctionName: 'QueryGptHandler',
  }));
  expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
    FunctionName: 'SendSmsHandler',
  }));
});

test('Test TextGptStack has a DynamoDB Table with a specific name', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');

  // Assert that the specific DynamoDB table is present
  expectCDK(stack).to(haveResource('AWS::DynamoDB::Table', {
    TableName: 'ConversationTable',
  }));
});

test('Test TextGptStack has an API Gateway', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');

  // Assert that there is an API Gateway in the stack
  expectCDK(stack).to(haveResource('AWS::ApiGateway::RestApi'));
});