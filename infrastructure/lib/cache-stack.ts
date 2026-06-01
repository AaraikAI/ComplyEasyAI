import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface CacheStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  redisSecurityGroup: ec2.SecurityGroup;
  /** Redis node type — defaults to cache.t3.micro for MVP */
  redisNodeType?: string;
}

/**
 * CacheStack — ElastiCache Redis 7.
 *
 * Database is hosted externally on Supabase (managed PostgreSQL).
 * This stack only provisions the Redis cache layer used for
 * session caching, BullMQ job queues, and real-time features.
 *
 * MVP cost optimisation:
 *  - Single-node Redis (no replication group)
 *  - cache.t3.micro (~$13/mo)
 */
export class CacheStack extends cdk.Stack {
  public readonly redisEndpoint: string;
  public readonly redisPort: string;
  /** Secret holding the Redis AUTH token (consumed by the backend). */
  public readonly authTokenSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const prefix = `complyeasy-${props.envName}`;

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

    // AUTH token generated and stored in Secrets Manager — never inlined.
    // The ElastiCache AUTH token must be 16–128 printable chars with no
    // characters that require URL-escaping, so restrict the generated set.
    this.authTokenSecret = new secretsmanager.Secret(this, 'RedisAuthToken', {
      secretName: `${prefix}/redis-auth-token`,
      description: `${prefix} ElastiCache Redis AUTH token`,
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // A replication group is required to enable in-transit/at-rest
    // encryption and an AUTH token. Single node group (1 primary, 0 replicas)
    // keeps the MVP cost profile while encrypting session/job-queue data.
    const redis = new elasticache.CfnReplicationGroup(this, 'Redis', {
      replicationGroupId: `${prefix}-redis`,
      replicationGroupDescription: `${prefix} Redis cache`,
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: props.redisNodeType ?? 'cache.t3.micro',
      numNodeGroups: 1,
      replicasPerNodeGroup: 0,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName!,
      securityGroupIds: [props.redisSecurityGroup.securityGroupId],
      snapshotRetentionLimit: 3,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      automaticFailoverEnabled: false,
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
      authToken: this.authTokenSecret.secretValue.unsafeUnwrap(),
    });

    redis.addDependency(redisSubnetGroup);

    this.redisEndpoint = redis.attrPrimaryEndPointAddress;
    this.redisPort = redis.attrPrimaryEndPointPort;

    // ---------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
    });
    new cdk.CfnOutput(this, 'RedisAuthTokenSecretArn', {
      value: this.authTokenSecret.secretArn,
      description: 'Secrets Manager ARN for the Redis AUTH token',
    });
  }
}
