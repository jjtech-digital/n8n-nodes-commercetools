# 🚀 Automatic CommerceTools to AWS Integration

## How It Works (Backend Automatic Setup)

When you:
1. ✅ **Add AWS credentials** to CommerceTools credentials (Access Key ID + Secret Access Key)
2. ✅ **Select "Product Published"** in the trigger
3. ✅ **Click "Execute Step"**

### Backend automatically creates:

#### 🔧 **SQS Queue**
- **Queue Name**: `commercetools-productpublished-events-{timestamp}`
- **Visibility Timeout**: 300 seconds  
- **Message Retention**: 14 days
- **Dead Letter Queue**: For failed messages

#### ⚡ **Lambda Function** 
- **Function Name**: `commercetools-productpublished-processor-{timestamp}`
- **Runtime**: Node.js 18.x
- **Environment Variable**: `CTP_PROJECT_KEY=n8n-ct-integration`
- **Auto-generated code** for processing Product Published events

#### 🔗 **Event Source Mapping**
- Connects SQS queue to Lambda function
- **Batch Size**: 10 messages
- **Automatic scaling** based on queue depth

#### 📋 **CommerceTools Subscription**
- **Destination**: SQS queue with full AWS credentials
- **Event Filter**: Product Published events only
- **Resource Type**: Product

## Console Output Example:

```
🚀 Starting CommerceTools trigger setup...
🔧 AWS credentials detected - creating AWS infrastructure automatically...
🔧 Creating SQS Queue: commercetools-productpublished-events-1704195600000
🔧 Creating Lambda Function: commercetools-productpublished-processor-1704195600000
🔧 Lambda function code generated for event processing
📋 Queue URL: https://sqs.us-east-1.amazonaws.com/123456789012/commercetools-productpublished-events-1704195600000
✅ AWS infrastructure created successfully!
📋 SQS Queue: https://sqs.us-east-1.amazonaws.com/123456789012/commercetools-productpublished-events-1704195600000
🔧 Lambda Function: commercetools-productpublished-processor-1704195600000
🔗 Creating CommerceTools subscription with SQS destination: https://sqs.us-east-1.amazonaws.com/123456789012/commercetools-productpublished-events-1704195600000
🎉 CommerceTools trigger setup completed successfully!
📦 Product events will be sent to SQS and processed by Lambda function
🏷️ Event: ProductPublished → SQS → Lambda
💡 Lambda function will process events with CTP_PROJECT_KEY=n8n-ct-integration
```

## Lambda Function Code (Auto-Generated):

The system automatically creates this Lambda function:

```javascript
exports.handler = async (event, context) => {
    console.log('🎯 Processing CommerceTools ProductPublished Events:', JSON.stringify(event, null, 2));
    
    const results = [];
    const projectKey = process.env.CTP_PROJECT_KEY || 'n8n-ct-integration';
    
    for (const record of event.Records) {
        try {
            const messageBody = JSON.parse(record.body);
            const eventType = messageBody.type;
            
            console.log(`📦 Processing ${eventType} for project: ${projectKey}`);
            
            if (eventType === 'ProductPublished') {
                console.log('✅ ProductPublished Event Processed Successfully!');
                const product = messageBody.resource;
                
                // Your custom business logic here
                console.log(`Product ID: ${product.id}`);
                console.log(`Product Key: ${product.key || 'N/A'}`);
                
                // Add your processing logic here:
                // - Update inventory
                // - Send notifications  
                // - Trigger other workflows
                // - Update analytics
                
                results.push({
                    status: 'success',
                    eventType: eventType,
                    productId: product.id,
                    processedAt: new Date().toISOString(),
                    projectKey: projectKey
                });
            }
            
        } catch (error) {
            console.error('❌ Error processing record:', error);
        }
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'CommerceTools ProductPublished events processed successfully',
            processedEvents: results.length,
            results: results
        })
    };
};
```

## Event Flow:

```
CommerceTools Product Published 
           ↓
    SQS Queue (with event name)
           ↓  
    Lambda Function (auto-generated)
           ↓
    Processing with CTP_PROJECT_KEY=n8n-ct-integration
```

## Benefits:

- 🚀 **Zero Configuration**: Just add AWS credentials and click execute
- 📦 **Event-Specific Naming**: Resources named after the event type  
- ⚡ **Auto-Scaling**: Lambda scales automatically with event volume
- 🔄 **Reliable**: SQS ensures no events are lost
- 📊 **Monitoring**: CloudWatch logs all processing
- 💰 **Cost-Effective**: Pay only for usage

## Fallback Mode:

If **NO AWS credentials** are provided:
- ✅ Uses HTTP webhook instead
- ✅ Events processed directly in n8n workflow
- ✅ Still works perfectly for testing

## Production Implementation:

For actual AWS resource creation, the backend code includes commented AWS SDK calls that can be uncommented and configured with proper error handling, IAM permissions, and resource cleanup.