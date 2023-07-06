// import * as cdk from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
// import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
// import { envConfig } from './config'
// import { GITHUB_TOKEN } from './text-gpt.constants';

// export class CodePipelineStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     new CodePipeline(this, 'Pipeline', {
//       pipelineName: 'CDKTestPipeline',
//       synth: new ShellStep('Synth', {
//         input: CodePipelineSource.gitHub(`${envConfig.github.GITHUB_OWNER}/${envConfig.github.GITHUB_REPO}`, 'main'), // replace the GitHub repository name with 'user-name/repository-name'

//         commands: ['echo GOOD LORD WE MADE IT']
//       }),
//     })
//   }
// }

// import { Construct } from 'constructs';
// import * as cdk from 'aws-cdk-lib';
// import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
// import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
// import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import { envConfig } from './config'
// import { GITHUB_TOKEN } from './text-gpt.constants';

// export class CodePipelineStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // The CodePipeline
//     const pipeline = new codepipeline.Pipeline(this, 'TextGptPipeline', {
//       pipelineName: 'TextGptPipeline',
//     });

//     // The Source Stage
//     const sourceOutput = new codepipeline.Artifact();
//     const sourceAction = new codepipeline_actions.GitHubSourceAction({
//       actionName: 'GitHub_Source',
//       owner: envConfig.github.GITHUB_OWNER,
//       repo: envConfig.github.GITHUB_REPO,
//       oauthToken: cdk.SecretValue.secretsManager(GITHUB_TOKEN),
//       output: sourceOutput,
//       branch: 'main',
//     });
//     pipeline.addStage({
//       stageName: 'Source',
//       actions: [sourceAction],
//     });

//     // The Build Stage
//     const buildProject = new codebuild.PipelineProject(this, 'TextGptBuildProject');
//     const buildAction = new codepipeline_actions.CodeBuildAction({
//       actionName: 'Build',
//       project: buildProject,
//       input: sourceOutput,
//       outputs: [new codepipeline.Artifact()],
//     });
//     pipeline.addStage({
//       stageName: 'Build',
//       actions: [buildAction],
//     });

// }
// }

//     // //CodePipeline
//     // const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
//     //     buildSpec: codebuild.BuildSpec.fromSourceFilename('../buildspec.yml'),
//     //     environment: {
//     //       buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
//     //     },
//     //   });
//     //   const sourceOutput = new codepipeline.Artifact();
//     //   const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');
//     //   console.log("PIPELINE 2");
//     //   const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
//     //     pipelineName: 'TextGptPipeline',
//     //     restartExecutionOnUpdate: true,
//     //   });
//     //   pipeline.addStage({
//     //     stageName: 'Source',
//     //     actions: [
//     //       new codepipelineActions.GitHubSourceAction({
//     //         actionName: 'GitHub_Source',
//     //         owner: envConfig.github.GITHUB_OWNER,
//     //         repo: envConfig.github.GITHUB_REPO,
//     //         oauthToken: cdk.SecretValue.secretsManager(GITHUB_TOKEN),
//     //         output: sourceOutput,
//     //         trigger: codepipelineActions.GitHubTrigger.WEBHOOK,
//     //       }),
//     //     ],
//     //   });
//     //   pipeline.addStage({
//     //     stageName: 'Build',
//     //     actions: [
//     //       new codepipelineActions.CodeBuildAction({
//     //         actionName: 'CDK_Build',
//     //         project: cdkBuild,
//     //         input: sourceOutput,
//     //         outputs: [cdkBuildOutput],
//     //       }),
//     //     ],
//     //   });
//     //   pipeline.addStage({
//     //     stageName: 'Deploy',
//     //     actions: [
//     //       new codepipelineActions.CloudFormationCreateUpdateStackAction({
//     //         actionName: 'CDK_Deploy',
//     //         templatePath: cdkBuildOutput.atPath('TextGptStack.template.json'),
//     //         stackName: 'TextGptStack',
//     //         adminPermissions: true,
//     //       }),
//     //     ],
//     //   });
