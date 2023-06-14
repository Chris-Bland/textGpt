#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TextGptStack } from '../lib/text_gpt-stack';

const app = new cdk.App();
new TextGptStack(app, 'TextGptStack');
