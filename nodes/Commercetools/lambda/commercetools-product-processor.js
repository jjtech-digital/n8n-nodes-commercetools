const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');

// Helper function to send webhook response
function sendWebhookResponse(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const url = new URL(webhookUrl);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'User-Agent': 'CommerceTools-Lambda-Processor/1.0'
            }
        };
        
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                console.log(`✅ Webhook response sent: ${res.statusCode}`);
                resolve({ statusCode: res.statusCode, data: responseData });
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Webhook error:', err);
            reject(err);
        });
        
        req.write(data);
        req.end();
    });
}

exports.handler = async (event, context) => {
    console.log('🎯 Processing CommerceTools Product Events:', JSON.stringify(event, null, 2));
    
    const results = [];
    const projectKey = process.env.CTP_PROJECT_KEY || 'n8n-ct-integration';
    const webhookUrl = process.env.WEBHOOK_URL;
    
    console.log(`📋 Project Key: ${projectKey}`);
    console.log(`🔗 Webhook URL: ${webhookUrl ? 'Configured' : 'Not configured'}`);
    
    for (const record of event.Records) {
        try {
            const messageBody = JSON.parse(record.body);
            const eventType = messageBody.type;
            const resource = messageBody.resource;
            
            console.log(`📦 Processing ${eventType} for project: ${projectKey}`);
            
            if (eventType === 'ProductPublished' || eventType === 'ProductCreated' || eventType === 'ProductDeleted') {
                console.log(`✅ ${eventType} Event Processed Successfully!`);
                
                // Extract product information
                const productId = resource.id;
                const productKey = resource.key || 'N/A';
                const version = resource.version || 1;
                const masterVariant = resource.masterData?.current?.masterVariant;
                const sku = masterVariant?.sku || 'N/A';
                const productName = resource.masterData?.current?.name || {};
                const categories = resource.masterData?.current?.categories || [];
                
                console.log(`📦 Product ID: ${productId}`);
                console.log(`🏷️  Product Key: ${productKey}`);
                console.log(`🔖 SKU: ${sku}`);
                console.log(`📝 Version: ${version}`);
                console.log(`📂 Categories: ${categories.length}`);
                
                // Prepare webhook payload
                const webhookPayload = {
                    eventType: eventType,
                    timestamp: new Date().toISOString(),
                    projectKey: projectKey,
                    product: {
                        id: productId,
                        key: productKey,
                        version: version,
                        sku: sku,
                        name: productName,
                        categories: categories,
                        masterVariant: masterVariant
                    },
                    source: 'CommerceTools-Lambda',
                    processed: true,
                    message: `Product ${eventType.toLowerCase()} event processed successfully`
                };
                
                // Send webhook response if URL is configured
                if (webhookUrl) {
                    try {
                        console.log('📤 Sending webhook response...');
                        const webhookResult = await sendWebhookResponse(webhookUrl, webhookPayload);
                        console.log(`✅ Webhook sent successfully: ${webhookResult.statusCode}`);
                        
                        webhookPayload.webhookStatus = 'sent';
                        webhookPayload.webhookResponse = webhookResult;
                    } catch (webhookError) {
                        console.error('❌ Webhook failed:', webhookError);
                        webhookPayload.webhookStatus = 'failed';
                        webhookPayload.webhookError = webhookError.message;
                    }
                } else {
                    console.log('⚠️  No webhook URL configured - skipping webhook response');
                    webhookPayload.webhookStatus = 'skipped';
                }
                
                // YOUR CUSTOM BUSINESS LOGIC HERE:
                console.log('🔄 Processing product in business systems...');
                await new Promise(resolve => setTimeout(resolve, 100));
                
                results.push({
                    status: 'success',
                    eventType: eventType,
                    productId: productId,
                    productKey: productKey,
                    sku: sku,
                    version: version,
                    processedAt: new Date().toISOString(),
                    projectKey: projectKey,
                    webhookStatus: webhookPayload.webhookStatus,
                    payload: webhookPayload
                });
                
                console.log(`✅ Product ${productId} processed successfully`);
                
            } else {
                console.log(`⚠️  Unhandled event type: ${eventType}`);
                results.push({
                    status: 'ignored',
                    eventType: eventType,
                    reason: 'Event type not configured for processing',
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Error processing record:', error);
            results.push({
                status: 'error',
                error: error.message,
                record: record.body,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    console.log(`📊 Processing complete: ${results.length} events processed`);
    
    // Final response
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'CommerceTools events processed successfully',
            processedEvents: results.length,
            successfulEvents: results.filter(r => r.status === 'success').length,
            ignoredEvents: results.filter(r => r.status === 'ignored').length,
            errorEvents: results.filter(r => r.status === 'error').length,
            webhookUrl: webhookUrl ? 'configured' : 'not configured',
            projectKey: projectKey,
            results: results,
            timestamp: new Date().toISOString()
        })
    };
    
    console.log('🎉 Lambda processing completed successfully!');
    return response;
};