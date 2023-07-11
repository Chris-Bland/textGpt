import { expect as expectCDK, haveResource} from '@aws-cdk/assert';
import { App } from 'aws-cdk-lib';
import { TextGptStack } from '../lib/text_gpt-stack';

test('Test TextGptStack has three SQS Queues with specific names', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');
  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const expectedQueueNames = [
    /ReceiveSmsQueue/,
    /SendSmsQueue/,
    /ErrorSmsQueue/,
    /ImageProcessorQueue/
  ];

  for (const queueNameRegex of expectedQueueNames) {
    const queueName = Object.keys(template.Resources).find((resourceName) =>
      queueNameRegex.test(resourceName)
    );
    expect(queueName).toBeDefined();
  }
});

test('Test TextGptStack has Lambda Functions with specific names', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');
  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const expectedLambdaNames = [
    /ReceiveSmsHandler/,
    /QueryGptHandler/,
    /SendSmsHandler/,
    /ImageProcessorHandler/
  ];

  for (const lambdaNameRegex of expectedLambdaNames) {
    const lambdaName = Object.keys(template.Resources).find((resourceName) =>
      lambdaNameRegex.test(resourceName)
    );
    expect(lambdaName).toBeDefined();
  }

});

test('Test TextGptStack has a DynamoDB Table with a specific name', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');
  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const expectedTableNames = /ConversationTable/;
  const tableName = Object.keys(template.Resources).find((resourceName) =>
  expectedTableNames.test(resourceName)
);
expect(tableName).toBeDefined();
});

test('Test TextGptStack has a S3 Bucket', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');
  const template = app.synth().getStackArtifact(stack.artifactId).template;
  const expectedBucketName = /GeneratedImageBucket/;
  const tableName = Object.keys(template.Resources).find((resourceName) =>
  expectedBucketName.test(resourceName)
);
expect(tableName).toBeDefined();
});

test('Test TextGptStack has an API Gateway', () => {
  const app = new App();
  const stack = new TextGptStack(app, 'TestTextGptStack');
  expectCDK(stack).to(haveResource('AWS::ApiGateway::RestApi'));
});