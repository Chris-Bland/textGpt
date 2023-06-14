import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as TextGpt from '../lib/text_gpt-stack';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TextGpt.TextGptStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

});
