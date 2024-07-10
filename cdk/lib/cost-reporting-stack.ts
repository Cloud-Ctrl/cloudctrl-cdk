import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cur from 'aws-cdk-lib/aws-cur';
import * as ce from 'aws-cdk-lib/aws-ce';
import {Construct} from 'constructs';

export class AwsCostReportingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudCtrlAccountId = '058552127514';
    const prefix = 'aws-cost-reporting';

    // S3 Bucket
    const billingReportsBucket = new s3.Bucket(this, 'BillingReportsBucket', {
      bucketName: `${prefix}-billing-reports`,
    });

    const conditions = {
      StringEquals: {
        'aws:SourceArn': `arn:aws:cur:us-east-1:${this.account}:definition/*`,
        'aws:SourceAccount': `${this.account}`,
      },
    };

    // IAM Policy for billing service account
    const getPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetBucketAcl', 's3:GetBucketPolicy'],
      resources: [billingReportsBucket.bucketArn],
      principals: [
        new iam.ServicePrincipal('billingreports.amazonaws.com'),
      ],
      conditions,
    });
    billingReportsBucket.addToResourcePolicy(getPolicy);

    const putPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject'],
      resources: [`${billingReportsBucket.bucketArn}/*`],
      principals: [
        new iam.ServicePrincipal('billingreports.amazonaws.com'),
      ],
      conditions,
    });
    billingReportsBucket.addToResourcePolicy(putPolicy);

    // Cost and Usage Report
    new cur.CfnReportDefinition(this, 'CloudctrlReportDefinition', {
      reportName: `${prefix}-cloudctrl`,
      s3Bucket: billingReportsBucket.bucketName,
      s3Prefix: 'cloudctrl',
      compression: 'ZIP',
      timeUnit: 'HOURLY',
      format: 'textORcsv',
      additionalSchemaElements: [
        'RESOURCES',
        'SPLIT_COST_ALLOCATION_DATA'],
      s3Region: this.region,
      reportVersioning: 'OVERWRITE_REPORT',
      refreshClosedReports: true,
    });


    // IAM Read Policy
    const cloudCtrlPolicy = new iam.ManagedPolicy(this, 'CloudCtrlPolicy', {
      managedPolicyName: `${prefix}-cloudctrl`,
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:GetObject',
              's3:ListBucket',
              's3:GetObjectAttributes',
              's3:GetBucketLocation',
            ],
            resources: [
              billingReportsBucket.bucketArn,
              `${billingReportsBucket.bucketArn}/*`,
            ],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:DescribeInstances',
              's3:ListAllMyBuckets',
              'compute-optimizer:GetEC2InstanceRecommendations',
              'compute-optimizer:GetEnrollmentStatus',
              'cloudwatch:GetMetricStatistics',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // IAM Role
    const cloudCtrlRole = new iam.Role(this, 'CloudCtrlRole', {
      roleName: `${prefix}-cloudctrl`,
      externalIds: [this.account],
      assumedBy: new iam.AccountPrincipal(cloudCtrlAccountId),
    });

    cloudCtrlRole.addManagedPolicy(cloudCtrlPolicy);

    new cdk.CfnOutput(this, 'RoleArn', {
      value: cloudCtrlRole.roleArn,
      description: 'The ARN of the IAM Role',
      exportName: `${this.stackName}-RoleArn`,
    });

    new cdk.CfnOutput(this, 'ExternalAccountId', {
      value: this.account,
      description: 'The external account ID',
      exportName: `${this.stackName}-ExternalAccountId`,
    });

    new cdk.CfnOutput(this, 'S3Region', {
      value: this.region,
      description: 'The region of the S3 bucket',
      exportName: `${this.stackName}-S3Region`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: billingReportsBucket.bucketName,
      description: 'The name of the S3 bucket',
      exportName: `${this.stackName}-S3BucketName`,
    });
  }
}