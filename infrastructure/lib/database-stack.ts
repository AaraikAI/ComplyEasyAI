import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
  redisSecurityGroup: ec2.SecurityGroup;
  /** RDS instance class — defaults to t3.small for MVP */
  dbInstanceClass?: ec2.InstanceType;
  /** Redis node type — defaults to cache.t3.micro for MVP */
  redisNodeType?: string;
}

/**
 * DatabaseStack — RDS PostgreSQL 16 + ElastiCache Redis 7.
 *
 * MVP cost optimisation:
 *  - Single-AZ RDS (no Multi-AZ standby)
 *  - Single-node Redis (no replication group)
 *  - 20 GB gp3 storage (expandable)
 *  - 7-day automated backup retention
 */
export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.ISecret;
  public readonly redisEndpoint: string;
  public readonly redisPort: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const prefix = `complyeasy-${props.envName}`;

    // ---------------------------------------------------------------
    // RDS PostgreSQL 16
    // ---------------------------------------------------------------
    this.dbInstance = new rds.DatabaseInstance(this, 'Postgres', {
      instanceIdentifier: `${prefix}-postgres`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType:
        props.dbInstanceClass ??
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.dbSecurityGroup],
      databaseName: 'complyeasy',
      credentials: rds.Credentials.fromGeneratedSecret('complyeasy_admin', {
        secretName: `${prefix}/rds-credentials`,
      }),
      multiAz: false, // MVP — enable for production HA
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // auto-scale storage
      storageType: rds.StorageType.GP3,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: props.envName === 'production',
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      publiclyAccessible: false,
      enablePerformanceInsights: true,
      monitoringInterval: cdk.Duration.seconds(60),
      parameterGroup: new rds.ParameterGroup(this, 'PgParams', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16,
        }),
        parameters: {
          'log_min_duration_statement': '1000', // log queries > 1s
          'shared_preload_libraries': 'pg_stat_statements',
        },
      }),
    });

    this.dbSecret = this.dbInstance.secret!;

    // ---------------------------------------------------------------
    // ElastiCache Redis 7 — single-node for MVP
    // ---------------------------------------------------------------
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnets',
      {
        description: `${prefix} Redis subnet group`,
        cacheSubnetGroupName: `${prefix}-redis-subnets`,
        subnetIds: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
      }
    );

    const redisCluster = new elasticache.CfnCacheCluster(this, 'Redis', {
      clusterName: `${prefix}-redis`,
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: props.redisNodeType ?? 'cache.t3.micro',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName!,
      vpcSecurityGroupIds: [props.redisSecurityGroup.securityGroupId],
      snapshotRetentionLimit: 3,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
    });

    redisCluster.addDependency(redisSubnetGroup);

    this.redisEndpoint = redisCluster.attrRedisEndpointAddress;
    this.redisPort = redisCluster.attrRedisEndpointPort;

    // ---------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
    });
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
    });
  }
}
