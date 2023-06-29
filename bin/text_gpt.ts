#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TextGptStack } from '../lib/text_gpt-stack';
import { CodePipelineStack } from '../lib/code-pipeline-stack'; 

const app = new cdk.App();
new TextGptStack(app, 'TextGptStack');

//For local deployment, create use the .env
new CodePipelineStack(app, 'CodePipelineStack', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
