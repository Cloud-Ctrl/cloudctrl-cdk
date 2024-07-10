# CloudCtrl setup for AWS using CDK

This is a CDK project to configure AWS resources for CloudCtrl Cost Usage Reporting.

This project creates the entire configuration required for "AWS Assume Role Credentials"

https://docs.cloudctrl.com.au/Setup/AWS/

## Prerequisites

* Node.js 20.x or later
* AWS CLI
* AWS CDK

## Getting Started

```bash
npm install
npx cdk bootstrap
npx cdk deploy
```

### Example output

![CDK Output](docs/cdk-output.png)

### CloudCtrl Configuration

To configure CloudCtrl use the outputs from the above command and enter them into the CloudCtrl AWS configuration using
the "Assume Role" configuration mode.

![CloudCtrl Configuration](docs/cloudctrl.png)