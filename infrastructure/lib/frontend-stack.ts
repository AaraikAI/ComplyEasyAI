import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  envName: string;
  /** ALB DNS name for API origin (proxied under /api/*) */
  apiAlbDnsName: string;
  /** Custom domain name for frontend (e.g. complyeasyai.com) — optional */
  domainName?: string;
  /** ACM certificate ARN in us-east-1 for CloudFront — optional */
  certificateArn?: string;
}

/**
 * FrontendStack — S3 bucket + CloudFront distribution for the React SPA.
 *
 * Routes:
 *  - /*       → S3 (React SPA with index.html fallback)
 *  - /api/*   → ALB (backend API via CloudFront origin)
 *  - /health  → ALB (health check passthrough)
 */
export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const prefix = `complyeasy-${props.envName}`;

    // ---------------------------------------------------------------
    // S3 Bucket for frontend assets
    // ---------------------------------------------------------------
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${prefix}-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy:
        props.envName === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'production',
      versioned: false,
    });

    // ---------------------------------------------------------------
    // S3 Bucket for application file uploads
    // ---------------------------------------------------------------
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${prefix}-uploads-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: props.domainName
            ? [`https://${props.domainName}`]
            : ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // ---------------------------------------------------------------
    // CloudFront — Origin Access Control for S3
    // ---------------------------------------------------------------
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(this.bucket);

    // API origin (ALB)
    const apiOrigin = new origins.HttpOrigin(props.apiAlbDnsName, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      httpsPort: 443,
    });

    // Certificate (must be in us-east-1 for CloudFront)
    const certificate = props.certificateArn
      ? acm.Certificate.fromCertificateArn(this, 'Cert', props.certificateArn)
      : undefined;

    this.distribution = new cloudfront.Distribution(this, 'CDN', {
      comment: `${prefix} frontend`,
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
        '/health': {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        },
        '/socket.io/*': {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      // SPA: serve index.html for all 403/404 (client-side routing)
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      domainNames: props.domainName ? [props.domainName] : undefined,
      certificate,
      minimumProtocolVersion:
        cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US/EU only — cheapest
    });

    // ---------------------------------------------------------------
    // Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID (for cache invalidation)',
    });
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.bucket.bucketName,
    });
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
    });
  }
}
