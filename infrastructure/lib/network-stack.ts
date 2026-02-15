import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  /** Application environment name (e.g. "production", "staging") */
  envName: string;
}

/**
 * NetworkStack — VPC, subnets, and security groups for ComplyEasyAI.
 *
 * Database is hosted externally on Supabase (managed PostgreSQL),
 * so no RDS security group is needed.
 *
 * MVP cost optimisation:
 *  - 2 AZs (minimum for ALB)
 *  - 1 NAT Gateway (saves ~$32/mo vs HA pair)
 *  - Isolated subnets for ElastiCache Redis
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const prefix = `complyeasy-${props.envName}`;

    // ---------------------------------------------------------------
    // VPC — 2 AZs, public + private + isolated subnets, 1 NAT GW
    // ---------------------------------------------------------------
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-vpc`,
      maxAzs: 2,
      natGateways: 1, // cost-optimised — scale to 2 for HA later
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // ---------------------------------------------------------------
    // Security Groups
    // ---------------------------------------------------------------

    // ALB — accepts 80/443 from the internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-alb-sg`,
      description: 'ALB — HTTP/HTTPS from internet',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP'
    );
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS'
    );

    // ECS Tasks — only from ALB
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ecs-sg`,
      description: 'ECS tasks — traffic from ALB only',
      allowAllOutbound: true,
    });
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3001),
      'API from ALB'
    );

    // ElastiCache Redis — only from ECS tasks
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-redis-sg`,
      description: 'ElastiCache Redis — ECS tasks only',
      allowAllOutbound: false,
    });
    this.redisSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Redis from ECS'
    );

    // ---------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
