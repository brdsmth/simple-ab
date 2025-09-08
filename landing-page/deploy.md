# Deployment Guide for SimpleAB Landing Page

This guide will help you deploy your SimpleAB landing page to AWS S3 and CloudFront for hosting at simpleabtesting.com.

## Prerequisites

- AWS CLI installed and configured
- Your domain simpleabtesting.com configured in Route 53
- SSL certificate for your domain (can be created in AWS Certificate Manager)

## Step 1: Build the Project

```bash
npm run build
```

This creates a `dist` directory with optimized static files.

## Step 2: Create S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket named `simpleabtesting.com`
3. Uncheck "Block all public access"
4. Enable static website hosting:
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)

## Step 3: Set Bucket Policy

Add this bucket policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::simpleabtesting.com/*"
    }
  ]
}
```

## Step 4: Upload Files to S3

Using AWS CLI:
```bash
aws s3 sync dist/ s3://simpleabtesting.com --delete
```

Or upload manually through the S3 console.

## Step 5: Create CloudFront Distribution

1. Go to CloudFront Console
2. Create a new distribution
3. Set origin domain to your S3 bucket's website endpoint
4. Configure:
   - Viewer Protocol Policy: "Redirect HTTP to HTTPS"
   - Alternate Domain Names (CNAMEs): `simpleabtesting.com`
   - SSL Certificate: Select your domain certificate
   - Default Root Object: `index.html`

5. Create custom error page for SPA routing:
   - HTTP Error Code: 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

## Step 6: Update Route 53

1. Go to Route 53 Console
2. Select your hosted zone for `simpleabtesting.com`
3. Create/update A record:
   - Record name: `simpleabtesting.com`
   - Record type: A
   - Alias: Yes
   - Alias target: Your CloudFront distribution

## Step 7: Automated Deployment (Optional)

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://simpleabtesting.com --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Environment Variables

For different environments, you can create:
- `.env.production` for production settings
- `.env.staging` for staging environment

## Performance Optimization

The build is already optimized with:
- Code splitting
- Asset optimization
- Gzip compression (enabled by CloudFront)
- CSS and JS minification

## Monitoring

Set up CloudWatch alarms for:
- CloudFront errors
- S3 access patterns
- Website uptime

Your landing page will be available at https://simpleabtesting.com once DNS propagates (usually 5-10 minutes).
