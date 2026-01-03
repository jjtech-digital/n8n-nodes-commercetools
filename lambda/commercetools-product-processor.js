const AWS = require('aws-sdk');

/**
 * Lambda function to process CommerceTools product events from SQS
 * This function handles Product Published events and processes them accordingly
 */
exports.handler = async (event, context) => {
    console.log('Processing CommerceTools Product Events:', JSON.stringify(event, null, 2));
    console.log(`Total records to process: ${context}`);
    
    const results = [];
    
    // Process each SQS record
    for (const record of event.Records) {
        try {
            // Parse the message body
            const messageBody = JSON.parse(record.body);
            console.log('Processing message:', JSON.stringify(messageBody, null, 2));
            
            // Extract CommerceTools event data
            const eventData = messageBody;
            const eventType = eventData.type;
            const projectKey = process.env.CTP_PROJECT_KEY || 'n8n-ct-integration';
            
            console.log(`Processing event type: ${eventType} for project: ${projectKey}`);
            
            // Handle different event types
            if (eventType === 'ProductPublished') {
                const result = await processProductPublishedEvent(eventData, projectKey);
                results.push(result);
            } else if (eventType === 'ProductCreated') {
                const result = await processProductCreatedEvent(eventData, projectKey);
                results.push(result);
            } else if (eventType === 'ProductDeleted') {
                const result = await processProductDeletedEvent(eventData, projectKey);
                results.push(result);
            } else {
                console.log(`Unhandled event type: ${eventType}`);
                results.push({
                    status: 'ignored',
                    eventType,
                    reason: 'Unhandled event type'
                });
            }
            
        } catch (error) {
            console.error('Error processing record:', error);
            results.push({
                status: 'error',
                error: error.message,
                record: record.body
            });
        }
    }
    
    console.log('Processing completed:', results);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Successfully processed CommerceTools events',
            processedEvents: results.length,
            results
        })
    };
};

/**
 * Process Product Published events
 */
async function processProductPublishedEvent(eventData, projectKey) {
    console.log(`Processing Product Published event for project: ${projectKey}`);
    
    const product = eventData.resource;
    const productId = product.id;
    const productKey = product.key;
    const masterVariant = product.masterData?.current?.masterVariant;
    
    console.log(`Product Published - ID: ${productId}, Key: ${productKey}`);
    
    // Example processing logic for Product Published
    // You can add your custom business logic here
    
    // Send notification to external systems
    await notifyExternalSystems('product-published', {
        projectKey,
        productId,
        productKey,
        masterVariant,
        timestamp: new Date().toISOString()
    });
    
    // Update analytics or tracking systems
    await updateAnalytics('product_published', {
        project_key: projectKey,
        product_id: productId,
        product_key: productKey
    });
    
    return {
        status: 'success',
        eventType: 'ProductPublished',
        productId,
        productKey,
        processedAt: new Date().toISOString()
    };
}

/**
 * Process Product Created events
 */
async function processProductCreatedEvent(eventData, projectKey) {
    console.log(`Processing Product Created event for project: ${projectKey}`);
    
    const product = eventData.resource;
    const productId = product.id;
    const productKey = product.key;
    
    console.log(`Product Created - ID: ${productId}, Key: ${productKey}`);
    
    // Add your custom logic for product creation
    await notifyExternalSystems('product-created', {
        projectKey,
        productId,
        productKey,
        timestamp: new Date().toISOString()
    });
    
    return {
        status: 'success',
        eventType: 'ProductCreated',
        productId,
        productKey,
        processedAt: new Date().toISOString()
    };
}

/**
 * Process Product Deleted events
 */
async function processProductDeletedEvent(eventData, projectKey) {
    console.log(`Processing Product Deleted event for project: ${projectKey}`);
    
    const productId = eventData.resourceId;
    
    console.log(`Product Deleted - ID: ${productId}`);
    
    // Add your custom logic for product deletion
    await notifyExternalSystems('product-deleted', {
        projectKey,
        productId,
        timestamp: new Date().toISOString()
    });
    
    return {
        status: 'success',
        eventType: 'ProductDeleted',
        productId,
        processedAt: new Date().toISOString()
    };
}

/**
 * Notify external systems (example implementation)
 */
async function notifyExternalSystems(eventType, data) {
    try {
        console.log(`Notifying external systems - Event: ${eventType}`, data);
        
        // Example: Send to SNS topic
        const sns = new AWS.SNS();
        const params = {
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: JSON.stringify(data),
            Subject: `CommerceTools ${eventType} Event`,
            MessageAttributes: {
                'event_type': {
                    DataType: 'String',
                    StringValue: eventType
                },
                'project_key': {
                    DataType: 'String',
                    StringValue: data.projectKey
                }
            }
        };
        
        if (process.env.SNS_TOPIC_ARN) {
            await sns.publish(params).promise();
            console.log('Successfully sent notification to SNS');
        }
        
        // Example: Send to external webhook
        if (process.env.WEBHOOK_URL) {
            const https = require('https');
            const url = require('url');
            
            const webhookUrl = new URL(process.env.WEBHOOK_URL);
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: webhookUrl.hostname,
                port: webhookUrl.port || 443,
                path: webhookUrl.pathname + webhookUrl.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    console.log(`Webhook response status: ${res.statusCode}`);
                    resolve();
                });
                
                req.on('error', (error) => {
                    console.error('Webhook error:', error);
                    reject(error);
                });
                
                req.write(postData);
                req.end();
            });
        }
        
    } catch (error) {
        console.error('Error notifying external systems:', error);
        // Don't throw error to avoid failing the entire process
    }
}

/**
 * Update analytics or tracking systems
 */
async function updateAnalytics(eventName, properties) {
    try {
        console.log(`Updating analytics - Event: ${eventName}`, properties);
        
        // Example: Send to CloudWatch custom metrics
        const cloudwatch = new AWS.CloudWatch();
        const params = {
            Namespace: 'CommerceTools/Events',
            MetricData: [
                {
                    MetricName: eventName,
                    Dimensions: [
                        {
                            Name: 'ProjectKey',
                            Value: properties.project_key
                        }
                    ],
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: new Date()
                }
            ]
        };
        
        await cloudwatch.putMetricData(params).promise();
        console.log('Successfully updated CloudWatch metrics');
        
    } catch (error) {
        console.error('Error updating analytics:', error);
        // Don't throw error to avoid failing the entire process
    }
}