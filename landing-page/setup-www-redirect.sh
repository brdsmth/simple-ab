#!/bin/bash

# Create www redirect bucket for simpleabtesting.com
# This script sets up www.simpleabtesting.com to redirect to simpleabtesting.com

echo "Creating www.simpleabtesting.com bucket for redirect..."

# 1. Create the www bucket
aws s3 mb s3://www.simpleabtesting.com

# 2. Configure the bucket for website hosting with redirect
aws s3 website s3://www.simpleabtesting.com \
  --redirect-all-requests-to HostName=simpleabtesting.com,Protocol=https

# 3. Set bucket policy to allow public read (required for website hosting)
aws s3api put-bucket-policy --bucket www.simpleabtesting.com --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::www.simpleabtesting.com/*"
    }
  ]
}'

# 4. Disable block public access (required for website hosting)
aws s3api put-public-access-block --bucket www.simpleabtesting.com --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo "✅ www.simpleabtesting.com bucket created and configured for redirect"
echo "📝 Next steps:"
echo "   1. Add Route 53 A record for www.simpleabtesting.com pointing to the S3 website endpoint"
echo "   2. Test the redirect by visiting http://www.simpleabtesting.com"
echo ""
echo "S3 website endpoint: www.simpleabtesting.com.s3-website-us-east-1.amazonaws.com"
