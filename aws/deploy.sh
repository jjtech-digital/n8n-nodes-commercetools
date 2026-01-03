#!/bin/bash

# CommerceTools AWS Infrastructure Deployment Script
# This script deploys SQS queue and Lambda function for processing CommerceTools product events

set -e

# Configuration
PROJECT_NAME="commercetools-integration"
ENVIRONMENT="dev"
CTP_PROJECT_KEY="n8n-ct-integration"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-stack"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured or credentials are invalid"
        echo "Please configure AWS CLI using 'aws configure' or set environment variables:"
        echo "  export AWS_ACCESS_KEY_ID=your-access-key"
        echo "  export AWS_SECRET_ACCESS_KEY=your-secret-key"
        echo "  export AWS_DEFAULT_REGION=us-east-1"
        exit 1
    fi
    print_status "AWS CLI configured successfully"
}

# Function to package and upload Lambda function
package_lambda() {
    print_status "Packaging Lambda function..."
    
    # Create temporary directory for packaging
    TEMP_DIR=$(mktemp -d)
    cp lambda/commercetools-product-processor.js "$TEMP_DIR/"
    
    # Install dependencies if package.json exists
    if [ -f "lambda/package.json" ]; then
        cp lambda/package.json "$TEMP_DIR/"
        cd "$TEMP_DIR"
        npm install --production
        cd - > /dev/null
    fi
    
    # Create ZIP file
    cd "$TEMP_DIR"
    zip -r "../lambda-deployment-package.zip" .
    cd - > /dev/null
    
    # Upload to S3 bucket (create if doesn't exist)
    S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-lambda-deployments"
    
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        print_status "Creating S3 bucket for Lambda deployments..."
        aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$S3_BUCKET" \
            --versioning-configuration Status=Enabled
    fi
    
    # Upload Lambda package
    LAMBDA_KEY="lambda/commercetools-product-processor-$(date +%Y%m%d_%H%M%S).zip"
    aws s3 cp "$TEMP_DIR/../lambda-deployment-package.zip" "s3://$S3_BUCKET/$LAMBDA_KEY"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    rm -f lambda-deployment-package.zip
    
    print_status "Lambda function packaged and uploaded to s3://$S3_BUCKET/$LAMBDA_KEY"
    echo "$S3_BUCKET" > .lambda-bucket
    echo "$LAMBDA_KEY" > .lambda-key
}

# Function to deploy CloudFormation stack
deploy_stack() {
    print_status "Deploying CloudFormation stack: $STACK_NAME"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
        print_status "Updating existing stack..."
        OPERATION="update-stack"
    else
        print_status "Creating new stack..."
        OPERATION="create-stack"
    fi
    
    # Deploy stack
    aws cloudformation "$OPERATION" \
        --stack-name "$STACK_NAME" \
        --template-body file://aws/cloudformation-template.yaml \
        --parameters \
            ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
            ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
            ParameterKey=CtpProjectKey,ParameterValue="$CTP_PROJECT_KEY" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION" \
        --tags \
            Key=Project,Value="$PROJECT_NAME" \
            Key=Environment,Value="$ENVIRONMENT" \
            Key=ManagedBy,Value=CloudFormation
    
    print_status "Waiting for stack operation to complete..."
    aws cloudformation wait stack-"${OPERATION//-/'-'}"complete --stack-name "$STACK_NAME" --region "$REGION"
    
    if [ $? -eq 0 ]; then
        print_status "Stack deployed successfully!"
    else
        print_error "Stack deployment failed!"
        exit 1
    fi
}

# Function to update Lambda function code
update_lambda_code() {
    if [ -f ".lambda-bucket" ] && [ -f ".lambda-key" ]; then
        S3_BUCKET=$(cat .lambda-bucket)
        LAMBDA_KEY=$(cat .lambda-key)
        
        print_status "Updating Lambda function code..."
        
        LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-${ENVIRONMENT}-product-processor"
        aws lambda update-function-code \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --s3-bucket "$S3_BUCKET" \
            --s3-key "$LAMBDA_KEY" \
            --region "$REGION"
        
        print_status "Lambda function code updated successfully!"
    fi
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Getting stack outputs..."
    
    outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table)
    
    echo ""
    echo "=== Stack Outputs ==="
    echo "$outputs"
    echo ""
    
    # Save important values to files for easy access
    SQS_QUEUE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`SQSQueueUrl`].OutputValue' \
        --output text)
    
    echo "$SQS_QUEUE_URL" > .sqs-queue-url
    echo "$REGION" > .aws-region
    
    print_status "Important values saved:"
    print_status "  SQS Queue URL: $SQS_QUEUE_URL"
    print_status "  AWS Region: $REGION"
    print_status "  Files created: .sqs-queue-url, .aws-region"
}

# Function to test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    if [ -f ".sqs-queue-url" ]; then
        SQS_QUEUE_URL=$(cat .sqs-queue-url)
        
        # Send test message to SQS
        TEST_MESSAGE='{
            "type": "ProductPublished",
            "resource": {
                "id": "test-product-123",
                "key": "test-product-key",
                "masterData": {
                    "current": {
                        "masterVariant": {
                            "id": 1,
                            "sku": "TEST-SKU-123"
                        }
                    }
                }
            },
            "resourceId": "test-product-123",
            "projectKey": "'$CTP_PROJECT_KEY'",
            "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
        }'
        
        print_status "Sending test message to SQS queue..."
        aws sqs send-message \
            --queue-url "$SQS_QUEUE_URL" \
            --message-body "$TEST_MESSAGE" \
            --region "$REGION"
        
        print_status "Test message sent! Check CloudWatch logs for Lambda execution."
        
        LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-${ENVIRONMENT}-product-processor"
        echo ""
        print_status "To view Lambda logs, run:"
        echo "aws logs tail /aws/lambda/$LAMBDA_FUNCTION_NAME --region $REGION --follow"
    fi
}

# Function to cleanup deployment
cleanup() {
    print_warning "Cleaning up deployment..."
    
    read -p "Are you sure you want to delete the CloudFormation stack? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
        print_status "Stack deletion initiated. This may take a few minutes..."
        aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
        print_status "Stack deleted successfully!"
        
        # Cleanup local files
        rm -f .lambda-bucket .lambda-key .sqs-queue-url .aws-region
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        print_status "Starting CommerceTools AWS deployment..."
        check_aws_config
        package_lambda
        deploy_stack
        update_lambda_code
        get_stack_outputs
        ;;
    "update")
        print_status "Updating Lambda function code..."
        check_aws_config
        package_lambda
        update_lambda_code
        ;;
    "outputs")
        get_stack_outputs
        ;;
    "test")
        test_deployment
        ;;
    "cleanup"|"destroy")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|update|outputs|test|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy complete infrastructure (default)"
        echo "  update   - Update Lambda function code only"
        echo "  outputs  - Show CloudFormation stack outputs"
        echo "  test     - Send test message to SQS queue"
        echo "  cleanup  - Delete all resources"
        exit 1
        ;;
esac

print_status "Script completed successfully!"