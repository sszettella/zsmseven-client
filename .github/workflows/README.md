# Deployment Pipeline Documentation

This repository uses GitHub Actions to automatically deploy the application to AWS S3 buckets.

## Environments

- **Development**: Deploys from `develop` branch to `s3://dev.zsm7.com`
- **Production**: Deploys from `main` branch to `s3://app.zsm7.com`

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions → Secrets):

### Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID with S3 permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region where S3 buckets are located | `us-east-1` |
| `DEV_API_URL` | Backend API URL for development | `https://dev-api.zsm7.com` |
| `PROD_API_URL` | Backend API URL for production | `https://api.zsm7.com` |

### Optional Variables

If using CloudFront for CDN, configure these in Settings → Secrets and variables → Actions → Variables:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `DEV_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID for dev | `E1234ABCD5678` |
| `PROD_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID for prod | `E9876ZYXW5432` |

## AWS IAM Permissions

The IAM user associated with the AWS credentials needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::dev.zsm7.com/*",
        "arn:aws:s3:::dev.zsm7.com",
        "arn:aws:s3:::app.zsm7.com/*",
        "arn:aws:s3:::app.zsm7.com"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-1"]
        }
      }
    }
  ]
}
```

## S3 Bucket Configuration

Ensure your S3 buckets are configured for static website hosting:

### Bucket Settings

1. **Static website hosting**: Enabled
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)

2. **Bucket policy** (replace `BUCKET_NAME` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

3. **CORS configuration** (if needed for API calls):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Deployment Triggers

### Automatic Deployments

- **Development**: Push or merge to `develop` branch
- **Production**: Push or merge to `main` branch

### Manual Deployments

You can trigger deployments manually:

1. Go to Actions tab in GitHub
2. Select "Deploy to S3" workflow
3. Click "Run workflow"
4. Select the branch to deploy

## Workflow Features

### Build Process

1. Checks out code
2. Sets up Node.js 20 with npm cache
3. Installs dependencies using `npm ci` (faster and more reliable than `npm install`)
4. Builds application with environment-specific API URLs
5. Deploys to S3

### Caching Strategy

- **Static assets** (JS, CSS, images): `max-age=31536000` (1 year) with public caching
- **index.html**: `max-age=0, no-cache` to ensure users always get the latest version

### CloudFront Invalidation

If CloudFront distribution IDs are configured, the workflow automatically invalidates the cache after deployment to ensure immediate propagation of changes.

## Branch Strategy

This pipeline assumes the following Git workflow:

```
main (production)
  ↑
  └── develop (development)
       ↑
       └── feature/* (feature branches)
```

**Recommended workflow:**
1. Create feature branches from `develop`
2. Merge features to `develop` → triggers dev deployment
3. Merge `develop` to `main` → triggers prod deployment

## Monitoring Deployments

### View Deployment Status

1. Go to the **Actions** tab in GitHub
2. Click on the latest workflow run
3. Expand job steps to see detailed logs

### Deployment URLs

- **Development**: http://dev.zsm7.com.s3-website-{region}.amazonaws.com (or custom domain)
- **Production**: http://app.zsm7.com.s3-website-{region}.amazonaws.com (or custom domain)

## Troubleshooting

### Build Failures

If the build fails:
1. Check the Action logs for TypeScript errors
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### Deployment Failures

If deployment fails:
1. Verify AWS credentials are correct
2. Check IAM permissions
3. Ensure S3 buckets exist and are accessible
4. Verify bucket names match the configuration

### API Connection Issues

If the deployed app can't connect to the API:
1. Verify `DEV_API_URL` and `PROD_API_URL` secrets are set correctly
2. Check CORS configuration on the API
3. Inspect browser console for errors
4. Verify the API is accessible from the deployed domain

## Local Testing

Test the production build locally:

```bash
# Build with production settings
VITE_API_BASE_URL=https://api.zsm7.com npm run build

# Preview the build
npm run preview
```

## Security Notes

- Never commit `.env` files with production credentials
- Rotate AWS credentials regularly
- Use least-privilege IAM policies
- Consider using AWS IAM roles with OIDC for GitHub Actions (more secure than access keys)
- Enable MFA on AWS accounts with deployment permissions

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
