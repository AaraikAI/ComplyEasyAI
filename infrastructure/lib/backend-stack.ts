import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface BackendStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  albSecurityGroup: ec2.SecurityGroup;
  ecsSecurityGroup: ec2.SecurityGroup;
  dbSecret: secretsmanager.ISecret;
  dbEndpoint: string;
  redisEndpoint: string;
  redisPort: string;
  /** ACM certificate ARN for HTTPS on ALB — optional */
  certificateArn?: string;
  /** S3 bucket name for file uploads */
  s3BucketName?: string;
}

/**
 * BackendStack — ECR repository, ECS Fargate cluster, ALB, and auto-scaling
 * for the ComplyEasyAI backend API.
 *
 * MVP cost optimisation:
 *  - 0.5 vCPU / 1 GB RAM Fargate tasks
 *  - Desired count = 1, auto-scales 1 → 4
 */
export class BackendStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly apiUrl: string;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const prefix = `complyeasy-${props.envName}`;

    // ---------------------------------------------------------------
    // ECR Repository
    // ---------------------------------------------------------------
    this.ecrRepository = new ecr.Repository(this, 'ApiRepo', {
      repositoryName: `${prefix}-api`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep last 10 images',
        },
      ],
    });

    // ---------------------------------------------------------------
    // Application Secrets — populate after deployment via AWS Console
    // or CLI. The deploy script will guide you through this.
    // ---------------------------------------------------------------
    const appSecret = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `${prefix}/app-secrets`,
      description: 'ComplyEasyAI application secrets (JWT, encryption, API keys)',
    });

    // ---------------------------------------------------------------
    // ECS Cluster
    // ---------------------------------------------------------------
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: prefix,
      vpc: props.vpc,
      containerInsights: true,
    });

    // ---------------------------------------------------------------
    // Task Definition
    // ---------------------------------------------------------------
    const taskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `${prefix}-api`,
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    // IAM — read RDS and app secrets
    props.dbSecret.grantRead(taskDef.taskRole);
    appSecret.grantRead(taskDef.taskRole);

    // IAM — S3 file uploads
    if (props.s3BucketName) {
      taskDef.taskRole.addToPrincipalPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            `arn:aws:s3:::${props.s3BucketName}`,
            `arn:aws:s3:::${props.s3BucketName}/*`,
          ],
        })
      );
    }

    // IAM — SES email sending
    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    // IAM — ECS Exec for debugging
    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'ssmmessages:CreateControlChannel',
          'ssmmessages:CreateDataChannel',
          'ssmmessages:OpenControlChannel',
          'ssmmessages:OpenDataChannel',
        ],
        resources: ['*'],
      })
    );

    // CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'ApiLogs', {
      logGroupName: `/ecs/${prefix}-api`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ---------------------------------------------------------------
    // Container Definition
    // ---------------------------------------------------------------
    taskDef.addContainer('api', {
      containerName: `${prefix}-api`,
      image: ecs.ContainerImage.fromEcrRepository(this.ecrRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3001',
        REDIS_URL: `redis://${props.redisEndpoint}:${props.redisPort}/0`,
        AWS_REGION: cdk.Stack.of(this).region,
        AWS_S3_BUCKET: props.s3BucketName ?? '',
        LOG_LEVEL: 'info',
        DB_HOST: props.dbEndpoint,
      },
      secrets: {
        // Individual DB credential fields from the RDS-generated secret
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
        DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'dbname'),
        DB_PORT: ecs.Secret.fromSecretsManager(props.dbSecret, 'port'),
        // Application secrets — individual fields
        JWT_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'JWT_SECRET'),
        JWT_REFRESH_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'JWT_REFRESH_SECRET'),
        ENCRYPTION_KEY: ecs.Secret.fromSecretsManager(appSecret, 'ENCRYPTION_KEY'),
        GEMINI_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'GEMINI_API_KEY'),
        SENDGRID_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'SENDGRID_API_KEY'),
        SENDGRID_FROM_EMAIL: ecs.Secret.fromSecretsManager(appSecret, 'SENDGRID_FROM_EMAIL'),
        STRIPE_SECRET_KEY: ecs.Secret.fromSecretsManager(appSecret, 'STRIPE_SECRET_KEY'),
        STRIPE_WEBHOOK_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'STRIPE_WEBHOOK_SECRET'),
      },
      portMappings: [{ containerPort: 3001, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: [
          'CMD-SHELL',
          'wget -qO- http://localhost:3001/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // ---------------------------------------------------------------
    // Application Load Balancer
    // ---------------------------------------------------------------
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: `${prefix}-alb`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTg', {
      targetGroupName: `${prefix}-api-tg`,
      vpc: props.vpc,
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // HTTPS listener if certificate provided
    if (props.certificateArn) {
      const cert = acm.Certificate.fromCertificateArn(
        this,
        'Cert',
        props.certificateArn
      );

      this.alb.addListener('HttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [cert],
        defaultTargetGroups: [targetGroup],
      });

      // HTTP → HTTPS redirect
      this.alb.addListener('HttpRedirect', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          statusCode: 'HTTP_301',
        }),
      });
    } else {
      this.alb.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });
    }

    // ---------------------------------------------------------------
    // ECS Fargate Service
    // ---------------------------------------------------------------
    this.service = new ecs.FargateService(this, 'ApiService', {
      serviceName: `${prefix}-api`,
      cluster: this.cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true,
    });

    this.service.attachToApplicationTargetGroup(targetGroup);

    // ---------------------------------------------------------------
    // Auto-scaling: 1 → 4 tasks
    // ---------------------------------------------------------------
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnRequestCount('RequestScaling', {
      requestsPerTarget: 500,
      targetGroup,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ---------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------
    this.apiUrl = this.alb.loadBalancerDnsName;

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS name for the API',
    });
    new cdk.CfnOutput(this, 'EcrRepoUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR repository URI for API images',
    });
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
    });
    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
    });
    new cdk.CfnOutput(this, 'AppSecretArn', {
      value: appSecret.secretArn,
      description: 'Populate this secret with your API keys via AWS Console or CLI',
    });
  }
}
