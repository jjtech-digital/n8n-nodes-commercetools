#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test webhook payload - simulating Lambda response
const testPayload = {
    eventType: "ProductPublished",
    timestamp: new Date().toISOString(),
    projectKey: "n8n-ct-integration",
    product: {
        id: "test-product-123",
        key: "test-product-key",
        version: 1,
        sku: "TEST-SKU-001",
        name: { 
            en: "Test Product Name",
            de: "Test Produktname"
        },
        categories: [
            { id: "category-1", name: "Electronics" },
            { id: "category-2", name: "Mobile" }
        ],
        masterVariant: {
            id: 1,
            sku: "TEST-SKU-001",
            prices: [
                {
                    value: { centAmount: 9999, currencyCode: "USD" }
                }
            ]
        }
    },
    source: "CommerceTools-Lambda",
    processed: true,
    message: "Product published event processed successfully by Lambda",
    webhookStatus: "sent",
    webhookResponse: { statusCode: 200 }
};

function sendTestWebhook(webhookUrl) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(testPayload);
        const url = new URL(webhookUrl);
        console.log(`${url}`);
        
        console.log(`🔗 Sending test webhook to: ${webhookUrl}`);
        console.log(`📦 Payload size: ${data.length} bytes`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`✅ Response status: ${res.statusCode}`);
                console.log(`📤 Response headers:`, res.headers);
                console.log(`📄 Response body:`, responseData);
                
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseData
                });
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Webhook request error:', err);
            reject(err);
        });
        
        console.log('📤 Sending request...');
        req.write(data);
        req.end();
    });
}

// Main function
async function main() {
    const webhookUrl = process.argv[2];
    
    if (!webhookUrl) {
        console.error('❌ Please provide webhook URL as argument');
        console.log('Usage: node test-webhook.js <webhook-url>');
        console.log('Example: node test-webhook.js "http://localhost:5678/webhook-test/abc123/commercetools-product-events"');
        process.exit(1);
    }
    
    try {
        console.log('🎯 Testing CommerceTools Lambda webhook response...');
        console.log(`📋 Simulating processed product event from Lambda`);
        
        const result = await sendTestWebhook(webhookUrl);
        
        console.log('🎉 Webhook test completed successfully!');
        console.log('✅ Check your n8n workflow - you should see the product data in the output!');
        
    } catch (error) {
        console.error('❌ Webhook test failed:', error);
        process.exit(1);
    }
}

// Run the test
main();