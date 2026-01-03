#!/bin/bash
set -e

PROJECT_NAME="commercetools-integration"
ENVIRONMENT="dev"
CTP_PROJECT_KEY="n8n-ct-integration"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-stack"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

echo "🚀 Deploying CommerceTools AWS infrastructure to region: $REGION"

# Check AWS CLI
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please check your credentials."
    exit 1
fi

# Create S3 bucket for deployments
S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-lambda-deployments-$(date +%s)"
aws s3 mb "s3://$S3_BUCKET" --region "$REGION" 2>/dev/null || true

# Package Lambda
cd ../lambda
zip -r ../aws/lambda.zip . -x "node_modules/*"
cd ../aws

# Upload Lambda package
aws s3 cp lambda.zip "s3://$S3_BUCKET/lambda.zip"

# Deploy stack (simplified CloudFormation)
cat > template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  S3Bucket:
    Type: String
Resources:
  EventQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "commercetools-integration-dev-product-events-${AWS::AccountId}"
      VisibilityTimeoutSeconds: 300
      MessageRetentionPeriod: 1209600
  
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:*
                Resource: !GetAtt EventQueue.Arn
  
  ProductProcessor:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "commercetools-integration-dev-product-processor-${AWS::AccountId}"
      Runtime: nodejs18.x
      Handler: commercetools-product-processor.handler
      Role: !GetAtt LambdaRole.Arn
      Code:
        S3Bucket: !Ref S3Bucket
        S3Key: lambda.zip
      Environment:
        Variables:
          CTP_PROJECT_KEY: n8n-ct-integration
  
  EventMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt EventQueue.Arn
      FunctionName: !Ref ProductProcessor

Outputs:
  QueueUrl:
    Value: !Ref EventQueue
  LambdaFunction:
    Value: !Ref ProductProcessor
EOF

aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name "$STACK_NAME-$(date +%s)" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --parameter-overrides S3Bucket="$S3_BUCKET"

# Get outputs
QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME-$(date +%s)" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`QueueUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -z "$QUEUE_URL" ]; then
    # Fallback: get the most recent stack
    LATEST_STACK=$(aws cloudformation list-stacks \
      --region "$REGION" \
      --query "StackSummaries[?starts_with(StackName, '$STACK_NAME')].StackName" \
      --output text | head -n1)
    
    if [ -n "$LATEST_STACK" ]; then
        QUEUE_URL=$(aws cloudformation describe-stacks \
          --stack-name "$LATEST_STACK" \
          --region "$REGION" \
          --query 'Stacks[0].Outputs[?OutputKey==`QueueUrl`].OutputValue' \
          --output text)
    fi
fi

echo "$QUEUE_URL" > .sqs-queue-url
echo "$REGION" > .aws-region

echo "✅ AWS infrastructure deployed successfully!"
echo "Queue URL: $QUEUE_URL"
echo "Region: $REGION"

case "${1:-}" in
  "outputs")
    echo "=== Stack Outputs ==="
    echo "SQS Queue URL: $QUEUE_URL"
    echo "AWS Region: $REGION"
    echo "Lambda Function: commercetools-integration-dev-product-processor"
    ;;
esac
