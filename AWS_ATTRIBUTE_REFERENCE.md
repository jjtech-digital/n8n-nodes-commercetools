# AWS SQS Attributes Reference

## ✅ **Fixed Issue: Correct SQS Attribute Names**

### **❌ Incorrect (caused the error):**
```javascript
Attributes: {
    VisibilityTimeoutSeconds: '300',  // ❌ Wrong attribute name
    MessageRetentionPeriod: '1209600',
    ReceiveMessageWaitTimeSeconds: '20'
}
```

### **✅ Correct (fixed version):**
```javascript  
Attributes: {
    'VisibilityTimeout': '300',           // ✅ Correct - no 'Seconds' suffix
    'MessageRetentionPeriod': '1209600',  // ✅ Correct
    'ReceiveMessageWaitTimeSeconds': '20' // ✅ Correct - this one keeps 'Seconds'
}
```

## 📋 **Common SQS Queue Attributes**

| Attribute Name | Description | Valid Values |
|----------------|-------------|--------------|
| `VisibilityTimeout` | Time messages remain invisible after being received | 0 to 43200 seconds (12 hours) |
| `MessageRetentionPeriod` | How long messages are kept in queue | 60 to 1209600 seconds (1 min to 14 days) |
| `ReceiveMessageWaitTimeSeconds` | Long polling wait time | 0 to 20 seconds |
| `MaxReceiveCount` | Max times message can be received before DLQ | 1 to 1000 |
| `DelaySeconds` | Default delay for new messages | 0 to 900 seconds |
| `KmsMasterKeyId` | KMS key for encryption | Key ID or alias |

## 🔧 **Error Handling Added**

The code now includes better error handling for:
- ✅ Invalid AWS credentials
- ✅ Permission denied errors  
- ✅ AWS service availability issues
- ✅ Detailed error logging with AWS error codes

## 🎯 **Status**

**ISSUE FIXED**: The "Unknown Attribute VisibilityTimeoutSeconds" error has been resolved by using the correct AWS SQS attribute name `VisibilityTimeout` instead of `VisibilityTimeoutSeconds`.

**Server Status**: ✅ n8n server is running successfully with the fixed code.