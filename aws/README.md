# CommerceTools SQS and Lambda Integration

This setup provides an AWS-based event processing system for CommerceTools product events using SQS queues and Lambda functions.

## Architecture Overview

```
CommerceTools → SQS Queue → Lambda Function → Processing Logic
                    ↓
               Dead Letter Queue (for failed messages)
                    ↓
               CloudWatch Alarms → SNS Notifications
```

## Features

- **Event Processing**: Handles Product Created, Published, and Deleted events
- **Reliable Messaging**: Uses SQS with Dead Letter Queue for failed messages
- **Scalable Processing**: Lambda function automatically scales based on queue depth
- **Monitoring**: CloudWatch alarms for errors and DLQ messages
- **Notifications**: SNS topic for alerts and notifications
- **Environment Configuration**: Support for multiple environments (dev, staging, prod)

## Quick Start

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js 18.x or later
3. CommerceTools API credentials

### Deployment Steps

1. **Configure the settings** in `aws/deploy.sh`:
   ```bash
   PROJECT_NAME="commercetools-integration"
   ENVIRONMENT="dev"
   CTP_PROJECT_KEY="n8n-ct-integration"
   REGION="us-east-1"
   ```

2. **Deploy the infrastructure**:
   ```bash
   cd aws
   ./deploy.sh deploy
   ```

3. **Get the deployment outputs**:
   ```bash
   ./deploy.sh outputs
   ```

4. **Test the deployment**:
   ```bash
   ./deploy.sh test
   ```

### Configure n8n CommerceTools Trigger

1. In your n8n workflow, add the CommerceTools Trigger node
2. Select "Amazon SQS" as the destination type
3. Configure the following parameters:
   - **AWS Region**: `us-east-1` (or your chosen region)
   - **SQS Queue URL**: Use the output from the deployment
   - **AWS Access Key ID**: Your AWS access key
   - **AWS Secret Access Key**: Your AWS secret key
   - **Lambda Function Name**: `commercetools-integration-dev-product-processor`
   - **CTP Project Key**: `n8n-ct-integration`
   - **Product Events**: Select `Product Published`

## Lambda Function Details

### Environment Variables

The Lambda function uses the following environment variables:

- `CTP_PROJECT_KEY`: CommerceTools project key (default: "n8n-ct-integration")
- `SNS_TOPIC_ARN`: ARN of SNS topic for notifications
- `ENVIRONMENT`: Environment name (dev, staging, prod)
- `WEBHOOK_URL`: Optional external webhook URL for notifications

### Event Processing

The function processes different types of CommerceTools events:

#### Product Published Event
```javascript
// Example event data structure
{
  "type": "ProductPublished",
  "resource": {
    "id": "product-id-123",
    "key": "product-key",
    "masterData": {
      "current": {
        "masterVariant": {
          "id": 1,
          "sku": "PRODUCT-SKU"
        }
      }
    }
  },
  "resourceId": "product-id-123",
  "projectKey": "n8n-ct-integration",
  "createdAt": "2026-01-02T10:30:00.000Z"
}
```

#### Processing Steps
1. Parse SQS message body
2. Extract event type and project key
3. Execute event-specific processing logic
4. Send notifications to external systems
5. Update analytics/metrics
6. Return processing results

### Customization

#### Adding Custom Processing Logic

Edit `lambda/commercetools-product-processor.js` and modify the event processing functions:

```javascript
async function processProductPublishedEvent(eventData, projectKey) {
    // Add your custom business logic here
    
    // Example: Update inventory system
    await updateInventorySystem(eventData.resource);
    
    // Example: Send to analytics
    await trackProductPublication(eventData.resource);
    
    // Example: Trigger other workflows
    await triggerDownstreamProcesses(eventData);
}
```

#### Adding New Event Types

1. Add new event types to the main handler:
```javascript
if (eventType === 'YourNewEventType') {
    const result = await processYourNewEvent(eventData, projectKey);
    results.push(result);
}
```

2. Implement the processing function:
```javascript
async function processYourNewEvent(eventData, projectKey) {
    // Your processing logic
    return {
        status: 'success',
        eventType: 'YourNewEventType',
        processedAt: new Date().toISOString()
    };
}
```

## Monitoring and Troubleshooting

### CloudWatch Logs

View Lambda execution logs:
```bash
aws logs tail /aws/lambda/commercetools-integration-dev-product-processor --region us-east-1 --follow
```

### CloudWatch Metrics

The setup includes the following alarms:

1. **Lambda Errors**: Triggers when the function encounters errors
2. **DLQ Messages**: Triggers when messages end up in the dead letter queue

### SQS Queue Monitoring

Check queue metrics in the AWS console:
- Number of messages in flight
- Number of messages in DLQ
- Processing duration
- Error rates

### Troubleshooting Common Issues

1. **Messages going to DLQ**:
   - Check Lambda function logs for errors
   - Verify the message format matches expected structure
   - Increase Lambda timeout if needed

2. **Lambda function timing out**:
   - Increase the timeout in CloudFormation template
   - Optimize processing logic
   - Consider batch processing for efficiency

3. **Authentication errors**:
   - Verify AWS credentials have necessary permissions
   - Check IAM roles and policies

## Development and Testing

### Local Testing

You can test the Lambda function locally using the AWS SAM CLI or by creating a test script:

```javascript
// test-local.js
const handler = require('./commercetools-product-processor').handler;

const testEvent = {
    Records: [{
        body: JSON.stringify({
            type: 'ProductPublished',
            resource: {
                id: 'test-product-123',
                key: 'test-product-key'
            },
            projectKey: 'n8n-ct-integration'
        })
    }]
};

handler(testEvent, {}).then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
});
```

### Updating Code

To update only the Lambda function code:
```bash
./deploy.sh update
```

## Security Considerations

1. **IAM Permissions**: The Lambda function has minimal required permissions
2. **VPC**: Consider deploying Lambda in VPC for additional security
3. **Encryption**: SQS queues and SNS topics support encryption at rest
4. **API Keys**: Store sensitive credentials in AWS Systems Manager Parameter Store

## Cost Optimization

1. **Lambda**: Pay per execution and duration
2. **SQS**: Pay per request (free tier: 1M requests/month)
3. **CloudWatch**: Pay for logs storage and custom metrics
4. **SNS**: Pay per notification sent

## Cleanup

To remove all resources:
```bash
./deploy.sh cleanup
```

This will delete:
- CloudFormation stack
- SQS queues
- Lambda function
- CloudWatch log groups
- SNS topic
- IAM roles and policies

## Support

For issues and questions:
1. Check CloudWatch logs first
2. Review the CommerceTools subscription configuration
3. Verify AWS resource permissions
4. Test with sample messages using the test command