import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
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
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
    });
  }
}
