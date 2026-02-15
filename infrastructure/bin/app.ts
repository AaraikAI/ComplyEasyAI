#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { CacheStack } from '../lib/cache-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';

// ---------------------------------------------------------------------------
// Configuration — override via CDK context or environment variables
// ---------------------------------------------------------------------------
const app = new cdk.App();

const envName = app.node.tryGetContext('envName') ?? 'production';
const region = app.node.tryGetContext('region') ?? 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;

// Optional: provide these for HTTPS and custom domain
const apiCertificateArn = app.node.tryGetContext('apiCertificateArn');
const cloudfrontCertificateArn = app.node.tryGetContext('cloudfrontCertificateArn');
const domainName = app.node.tryGetContext('domainName');

const env: cdk.Environment = { account, region };

// ---------------------------------------------------------------------------
// Stack: Network (VPC, subnets, security groups)
// ---------------------------------------------------------------------------
const network = new NetworkStack(app, `ComplyEasy-Network`, {
  env,
  envName,
  description: 'ComplyEasyAI — VPC, subnets, and security groups',
});

// ---------------------------------------------------------------------------
// Stack: Cache (ElastiCache Redis)
// Database is hosted externally on Supabase — no RDS provisioned here.
// ---------------------------------------------------------------------------
const cache = new CacheStack(app, `ComplyEasy-Cache`, {
  env,
  envName,
  vpc: network.vpc,
  redisSecurityGroup: network.redisSecurityGroup,
  description: 'ComplyEasyAI — ElastiCache Redis 7 (DB on Supabase)',
});

// ---------------------------------------------------------------------------
// Stack: Backend (ECR, ECS Fargate, ALB)
// Connects to Supabase PostgreSQL via DATABASE_URL in Secrets Manager.
// ---------------------------------------------------------------------------
const backend = new BackendStack(app, `ComplyEasy-Backend`, {
  env,
  envName,
  vpc: network.vpc,
  albSecurityGroup: network.albSecurityGroup,
  ecsSecurityGroup: network.ecsSecurityGroup,
  redisEndpoint: cache.redisEndpoint,
  redisPort: cache.redisPort,
  certificateArn: apiCertificateArn,
  description: 'ComplyEasyAI — ECS Fargate API + ALB',
});

// ---------------------------------------------------------------------------
// Stack: Frontend (S3 + CloudFront)
// ---------------------------------------------------------------------------
const frontend = new FrontendStack(app, `ComplyEasy-Frontend`, {
  env,
  envName,
  apiAlbDnsName: backend.alb.loadBalancerDnsName,
  domainName,
  certificateArn: cloudfrontCertificateArn,
  description: 'ComplyEasyAI — S3 + CloudFront for React SPA',
});

// ---------------------------------------------------------------------------
// Tags applied to all resources
// ---------------------------------------------------------------------------
cdk.Tags.of(app).add('Project', 'ComplyEasyAI');
cdk.Tags.of(app).add('Environment', envName);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
