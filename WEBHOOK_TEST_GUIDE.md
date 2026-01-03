# 🧪 Test Webhook Integration

## ✅ **Fixed Issues:**

### **Problem:** 
Lambda was processing events but n8n workflow wasn't showing the output.

### **Solution:**
Enhanced the webhook function to properly parse and display:
1. ✅ **Lambda webhook responses** (processed CommerceTools events)
2. ✅ **Direct CommerceTools events** 
3. ✅ **Generic webhook data**

## 🔧 **How to Test:**

### **Method 1: Use the Test Script**
```bash
# Get your webhook URL from n8n workflow (it shows when you activate the trigger)
# Example URL: http://localhost:5678/webhook-test/abc123/commercetools-product-events

node test-webhook.js "YOUR_WEBHOOK_URL_HERE"
```

### **Method 2: Use curl**
```bash
curl -X POST "YOUR_WEBHOOK_URL_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "ProductPublished",
    "timestamp": "2026-01-02T08:00:00Z",
    "projectKey": "n8n-ct-integration",
    "product": {
      "id": "test-product-123",
      "key": "test-product-key",
      "sku": "TEST-SKU-001",
      "name": {"en": "Test Product"}
    },
    "source": "CommerceTools-Lambda",
    "processed": true,
    "message": "Test event processed successfully"
  }'
```

## 📤 **Expected n8n Output:**

When the webhook is triggered, you should see in n8n:

```json
{
  "eventType": "ProductPublished",
  "timestamp": "2026-01-02T08:00:00Z", 
  "projectKey": "n8n-ct-integration",
  "source": "CommerceTools-Lambda",
  "processed": true,
  "message": "Product published event processed successfully",
  "product": {
    "id": "test-product-123",
    "key": "test-product-key",
    "version": 1,
    "sku": "TEST-SKU-001",
    "name": {"en": "Test Product"},
    "categories": [...],
    "masterVariant": {...}
  },
  "webhookStatus": "sent",
  "lambdaProcessed": true
}
```

## 🎯 **What's Fixed:**

1. ✅ **Enhanced webhook parsing** - Detects Lambda responses vs direct events
2. ✅ **Rich output data** - Shows complete product information
3. ✅ **Better error handling** - Clear error messages for debugging
4. ✅ **Proper data structure** - Clean, organized output for workflows
5. ✅ **Source identification** - Knows if data came from Lambda or direct

## 🚀 **Next Steps:**

1. **Activate your CommerceTools Trigger** in n8n
2. **Copy the webhook URL** that appears
3. **Run the test script** to verify webhook is working
4. **Publish a product** in CommerceTools to test real flow
5. **Check n8n output** - you should see the processed product data!

**Status: READY FOR TESTING! 🎉**