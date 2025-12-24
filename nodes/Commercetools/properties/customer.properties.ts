import type { INodeProperties } from 'n8n-workflow';

export const customerOperations: INodeProperties[] = [
    {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
        {
            name: 'Authenticate (Sign In)',
            value: 'authenticate',
            action: 'Authenticate customer',
            description: 'Sign in a customer with email and password',
        },
        {
            name: 'Authenticate in Store',
            value: 'authenticateInStore',
            action: 'Authenticate customer in store',
            description: 'Sign in a customer with email and password in a specific store',
        },
        {
            name: 'Change Password',
            value: 'changePassword',
            action: 'Change customer password',
            description: 'Change password of a customer',
        },
        {
            name: 'Change Password in Store',
            value: 'changePasswordInStore',
            action: 'Change customer password in store',
            description: 'Change password of a customer in a specific store',
        },
        {
            name: 'Check Existence',
            value: 'head',
            action: 'Check if customer exists',
            description: 'Check whether a customer exists by ID',
        },
        {
            name: 'Check Existence By Key',
            value: 'headByKey',
            action: 'Check if customer exists by key',
            description: 'Check whether a customer exists using its key',
        },
        {
            name: 'Check Existence By Query',
            value: 'headByQuery',
            action: 'Check if any customer matches the query',
            description: 'Send a HEAD request with query predicates to check for matches',
        },
        {
            name: 'Check Existence in Store',
            value: 'headInStore',
            action: 'Check if customer exists in store',
            description: 'Check whether a customer exists by ID in a specific store',
        },
        {
            name: 'Check Existence in Store By Key',
            value: 'headInStoreByKey',
            action: 'Check if customer exists in store by key',
            description: 'Check whether a customer exists by key in a specific store',
        },
        {
            name: 'Check Existence in Store By Query',
            value: 'headInStoreByQuery',
            action: 'Check if any customer matches the query in store',
            description: 'Send a HEAD request with query predicates in a specific store',
        },
        {
            name: 'Create (Sign Up)',
            value: 'create',
            action: 'Create customer',
            description: 'Create a new customer (sign up)',
        },
        {
            name: 'Create Email Token',
            value: 'createEmailToken',
            action: 'Create email verification token',
            description: 'Create an email verification token for a customer',
        },
        {
            name: 'Create Email Token in Store',
            value: 'createEmailTokenInStore',
            action: 'Create email verification token in store',
            description: 'Create an email verification token for a customer in a specific store',
        },
        {
            name: 'Create in Store (Sign Up)',
            value: 'createInStore',
            action: 'Create customer in store',
            description: 'Create a new customer in a specific store',
        },
        {
            name: 'Create Password Reset Token',
            value: 'createPasswordResetToken',
            action: 'Create password reset token',
            description: 'Create a password reset token for a customer',
        },
        {
            name: 'Create Password Reset Token in Store',
            value: 'createPasswordResetTokenInStore',
            action: 'Create password reset token in store',
            description: 'Create a password reset token for a customer in a specific store',
        },
        {
            name: 'Delete',
            value: 'delete',
            action: 'Delete customer',
            description: 'Delete a customer by ID',
        },
        {
            name: 'Delete By Key',
            value: 'deleteByKey',
            action: 'Delete customer by key',
            description: 'Delete a customer using its key',
        },
        {
            name: 'Delete in Store',
            value: 'deleteInStore',
            action: 'Delete customer in store',
            description: 'Delete a customer by ID in a specific store',
        },
        {
            name: 'Delete in Store By Key',
            value: 'deleteInStoreByKey',
            action: 'Delete customer in store by key',
            description: 'Delete a customer by key in a specific store',
        },
        {
            name: 'Get',
            value: 'get',
            action: 'Get customer',
            description: 'Retrieve a customer by ID',
        },
        {
            name: 'Get By Email Token',
            value: 'getByEmailToken',
            action: 'Get customer by email token',
            description: 'Retrieve a customer using an email verification token',
        },
        {
            name: 'Get By Key',
            value: 'getByKey',
            action: 'Get customer by key',
            description: 'Retrieve a customer using its key',
        },
        {
            name: 'Get By Password Token',
            value: 'getByPasswordToken',
            action: 'Get customer by password token',
            description: 'Retrieve a customer using a password reset token',
        },
        {
            name: 'Get in Store',
            value: 'getInStore',
            action: 'Get customer in store',
            description: 'Retrieve a customer by ID in a specific store',
        },
        {
            name: 'Get in Store By Email Token',
            value: 'getInStoreByEmailToken',
            action: 'Get customer in store by email token',
            description: 'Retrieve a customer by email token in a specific store',
        },
        {
            name: 'Get in Store By Key',
            value: 'getInStoreByKey',
            action: 'Get customer in store by key',
            description: 'Retrieve a customer by key in a specific store',
        },
        {
            name: 'Get in Store By Password Token',
            value: 'getInStoreByPasswordToken',
            action: 'Get customer in store by password token',
            description: 'Retrieve a customer by password token in a specific store',
        },
        {
            name: 'Query',
            value: 'query',
            action: 'Query customers',
            description: 'List customers using query parameters',
        },
        {
            name: 'Query in Store',
            value: 'queryInStore',
            action: 'Query customers in store',
            description: 'List customers in a specific store using query parameters',
        },
        {
            name: 'Reset Password',
            value: 'resetPassword',
            action: 'Reset customer password',
            description: 'Reset password of a customer using a reset token',
        },
        {
            name: 'Reset Password in Store',
            value: 'resetPasswordInStore',
            action: 'Reset customer password in store',
            description: 'Reset password of a customer in a specific store using a reset token',
        },
        {
            name: 'Update',
            value: 'update',
            action: 'Update customer',
            description: 'Perform update actions on a customer by ID',
        },
        {
            name: 'Update By Key',
            value: 'updateByKey',
            action: 'Update customer by key',
            description: 'Perform update actions on a customer by key',
        },
        {
            name: 'Update in Store',
            value: 'updateInStore',
            action: 'Update customer in store',
            description: 'Perform update actions on a customer by ID in a specific store',
        },
        {
            name: 'Update in Store By Key',
            value: 'updateInStoreByKey',
            action: 'Update customer in store by key',
            description: 'Perform update actions on a customer by key in a specific store',
        },
        {
            name: 'Verify Email',
            value: 'verifyEmail',
            action: 'Verify customer email',
            description: 'Verify email address of a customer using a verification token',
        },
        {
            name: 'Verify Email in Store',
            value: 'verifyEmailInStore',
            action: 'Verify customer email in store',
            description: 'Verify email address of a customer in a specific store',
        },
    ],
    default: 'query',
    displayOptions: {
        show: {
            resource: ['customer'],
        },
    },
}];

// Complete customer field definitions extracted from main file
export const customerIdentificationFields: INodeProperties[] = [
    {
            displayName: 'Customer ID',
            name: 'customerId',
            type: 'string',
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['get', 'update', 'delete', 'head', 'changePassword', 'changePasswordInStore', 'getInStore', 'updateInStore', 'deleteInStore', 'headInStore', 'createEmailToken'],
                },
            },
            description: 'The unique ID of the customer',
        },
        {
            displayName: 'Customer Key',
            name: 'customerKey',
            type: 'string',
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['getByKey', 'updateByKey', 'deleteByKey', 'headByKey', 'getInStoreByKey', 'updateInStoreByKey', 'deleteInStoreByKey', 'headInStoreByKey'],
                },
            },
            description: 'The unique key of the customer',
        },
        {
            displayName: 'Store Key',
            name: 'storeKey',
            type: 'string',
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['authenticateInStore', 'changePasswordInStore', 'createInStore', 'getInStore', 'getInStoreByKey', 'getInStoreByEmailToken', 'getInStoreByPasswordToken', 'updateInStore', 'updateInStoreByKey', 'deleteInStore', 'deleteInStoreByKey', 'headInStore', 'headInStoreByKey', 'headInStoreByQuery', 'queryInStore', 'resetPasswordInStore', 'createPasswordResetTokenInStore', 'createEmailTokenInStore', 'verifyEmailInStore'],
                },
            },
            description: 'The key of the store',
        },
        {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['authenticate', 'authenticateInStore', 'createPasswordResetToken', 'createPasswordResetTokenInStore'],
                },
            },
            description: 'The email address of the customer',
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['authenticate', 'authenticateInStore'],
                },
            },
            description: 'The password of the customer',
        },
        {
            displayName: 'Current Password',
            name: 'currentPassword',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['changePassword', 'changePasswordInStore'],
                },
            },
            description: 'The current password of the customer',
        },
        {
            displayName: 'New Password',
            name: 'newPassword',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['changePassword', 'changePasswordInStore', 'resetPassword', 'resetPasswordInStore'],
                },
            },
            description: 'The new password for the customer',
        },
        {
            displayName: 'Password Token',
            name: 'passwordToken',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['getByPasswordToken', 'getInStoreByPasswordToken'],
                },
            },
            description: 'The password reset token',
        },
        {
            displayName: 'Email Token',
            name: 'emailToken',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['getByEmailToken', 'getInStoreByEmailToken'],
                },
            },
            description: 'The email verification token',
        },
        {
            displayName: 'Token Value',
            name: 'tokenValue',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['resetPassword', 'resetPasswordInStore', 'verifyEmail', 'verifyEmailInStore'],
                },
            },
            description: 'The token value for password reset or email verification',
        },
        {
            displayName: 'Version',
            name: 'version',
            type: 'number',
            default: 1,
            required: true,
            typeOptions: {
                minValue: 1,
            },
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey', 'delete', 'deleteByKey', 'deleteInStore', 'deleteInStoreByKey', 'changePassword', 'changePasswordInStore', 'createEmailToken', 'createEmailTokenInStore'],
                },
            },
            description: 'Current version of the customer for optimistic locking',
        },
        {
            displayName: 'TTL Minutes',
            name: 'ttlMinutes',
            type: 'number',
            default: 4320,
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['createEmailToken', 'createEmailTokenInStore'],
                },
            },
            description: 'Validity period of the generated token in minutes (default: 4320 = 3 days)',
        },
];

export const customerDraftFields: INodeProperties[] = [
	{
            displayName: 'Customer Draft (JSON)',
            name: 'customerDraft',
            type: 'json',
            default: '{}',
            required: true,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['create', 'createInStore'],
                },
            },
            description: 'JSON representation of the customer draft to create, e.g. <code>{"email":"user@example.com","password":"secret","firstName":"John","lastName":"Doe"}</code>',
        },
];

export const customerAdditionalFields: INodeProperties[] = [
	{
            displayName: 'Actions (JSON)',
            name: 'actions',
            type: 'json',
            default: '[]',
            description: 'Update actions to apply to the resource',
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['update', 'updateByKey'],
                },
            },
        },
        {
            displayName: 'Actions (UI)',
            name: 'customerActionsUi',
            type: 'fixedCollection',
            default: {},
            placeholder: 'Add Action',
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
                },
            },
            typeOptions: {
                multipleValues: true,
            },
            description: 'Update actions to perform on the customer',
            options: [
                {
                    displayName: 'Action',
                    name: 'action',
                    values: [
                        {
                            displayName: 'Action Type',
                            name: 'actionType',
                            type: 'options',
                            options: [
                                {
                                    name: 'Add Address',
                                    value: 'addAddress',
                                },
                                {
                                    name: 'Add Billing Address ID',
                                    value: 'addBillingAddressId',
                                },
                                {
                                    name: 'Add CustomerGroupAssignment',
                                    value: 'addCustomerGroupAssignment',
                                },
                                {
                                    name: 'Add Shipping Address ID',
                                    value: 'addShippingAddressId',
                                },
                                {
                                    name: 'Add Store',
                                    value: 'addStore',
                                },
                                {
                                    name: 'Change Address',
                                    value: 'changeAddress',
                                },
                                {
                                    name: 'Change Email',
                                    value: 'changeEmail',
                                },
                                {
                                    name: 'Remove Address',
                                    value: 'removeAddress',
                                },
                                {
                                    name: 'Remove Billing Address ID',
                                    value: 'removeBillingAddressId',
                                },
                                {
                                    name: 'Remove CustomerGroupAssignment',
                                    value: 'removeCustomerGroupAssignment',
                                },
                                {
                                    name: 'Remove Shipping Address ID',
                                    value: 'removeShippingAddressId',
                                },
                                {
                                    name: 'Remove Store',
                                    value: 'removeStore',
                                },
                                {
                                    name: 'Set Authentication Mode',
                                    value: 'setAuthenticationMode',
                                },
                                {
                                    name: 'Set Company Name',
                                    value: 'setCompanyName',
                                },
                                {
                                    name: 'Set Custom Field',
                                    value: 'setCustomField',
                                },
                                {
                                    name: 'Set Custom Field in Address',
                                    value: 'setCustomFieldInAddress',
                                },
                                {
                                    name: 'Set Custom Type',
                                    value: 'setCustomType',
                                },
                                {
                                    name: 'Set Custom Type in Address',
                                    value: 'setCustomTypeInAddress',
                                },
                                {
                                    name: 'Set Customer Group',
                                    value: 'setCustomerGroup',
                                },
                                {
                                    name: 'Set Customer Number',
                                    value: 'setCustomerNumber',
                                },
                                {
                                    name: 'Set CustomerGroupAssignments',
                                    value: 'setCustomerGroupAssignments',
                                },
                                {
                                    name: 'Set Date of Birth',
                                    value: 'setDateOfBirth',
                                },
                                {
                                    name: 'Set Default Billing Address',
                                    value: 'setDefaultBillingAddress',
                                },
                                {
                                    name: 'Set Default Shipping Address',
                                    value: 'setDefaultShippingAddress',
                                },
                                {
                                    name: 'Set External ID',
                                    value: 'setExternalId',
                                },
                                {
                                    name: 'Set First Name',
                                    value: 'setFirstName',
                                },
                                {
                                    name: 'Set Last Name',
                                    value: 'setLastName',
                                },
                                {
                                    name: 'Set Locale',
                                    value: 'setLocale',
                                },
                                {
                                    name: 'Set Middle Name',
                                    value: 'setMiddleName',
                                },
                                {
                                    name: 'Set Salutation',
                                    value: 'setSalutation',
                                },
                                {
                                    name: 'Set Stores',
                                    value: 'setStores',
                                },
                                {
                                    name: 'Set Title',
                                    value: 'setTitle',
                                },
                                {
                                    name: 'Set Vat ID',
                                    value: 'setVatId',
                                },
                            ],
                            default: 'changeEmail',
                        },
                        {
                            displayName: 'Additional Address Info',
                            name: 'additionalAddressInfo',
                            type: 'string',
                            default: '',
                            description: 'Additional address information',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Additional Street Info',
                            name: 'additionalStreetInfo',
                            type: 'string',
                            default: '',
                            description: 'Additional street information',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Address Email',
                            name: 'addressEmail',
                            type: 'string',
                            default: '',
                            description: 'Email address for this address (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Address ID',
                            name: 'addressId',
                            type: 'string',
                            default: '',
                            description: 'ID of the address',
                            displayOptions: {
                                show: {
                                    actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
                                    addressReferenceType: ['id'],
                                },
                            },
                        },
                        {
                            displayName: 'Address Key',
                            name: 'addressKey',
                            type: 'string',
                            default: '',
                            description: 'Key of the address',
                            displayOptions: {
                                show: {
                                    actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
                                    addressReferenceType: ['key'],
                                },
                            },
                        },
                        {
                            displayName: 'Address Reference Type',
                            name: 'addressReferenceType',
                            type: 'options',
                            options: [
                                {
                                    name: 'ID',
                                    value: 'id',
                                    description: 'Reference address by ID',
                                },
                                {
                                    name: 'Key',
                                    value: 'key',
                                    description: 'Reference address by key',
                                },
                        ],
                            default: 'id',
                            description: 'Whether to reference the address by ID or key',
                            displayOptions: {
                                show: {
                                    actionType: ['addBillingAddressId', 'addShippingAddressId', 'removeBillingAddressId', 'removeShippingAddressId', 'removeAddress', 'changeAddress', 'changeAddressId', 'setDefaultBillingAddress', 'setDefaultShippingAddress', 'setAddressCustomField', 'setAddressCustomType', 'setCustomFieldInAddress', 'setCustomTypeInAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Apartment',
                            name: 'apartment',
                            type: 'string',
                            default: '',
                            description: 'Apartment, suite, unit, etc (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Authentication Mode',
                            name: 'authMode',
                            type: 'options',
                            options: [
                                {
                                    name: 'Password',
                                    value: 'Password',
                                },
                                {
                                    name: 'External Auth',
                                    value: 'ExternalAuth',
                                },
                        ],
                            default: 'Password',
                            description: 'Authentication mode for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setAuthenticationMode'],
                                },
                            },
                        },
                        {
                            displayName: 'Building',
                            name: 'building',
                            type: 'string',
                            default: '',
                            description: 'Building name or number (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'City',
                            name: 'city',
                            type: 'string',
                            default: '',
                            description: 'City name',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Company Name',
                            name: 'companyName',
                            type: 'string',
                            default: '',
                            description: 'Company name for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setCompanyName'],
                                },
                            },
                        },
                        {
                            displayName: 'Country',
                            name: 'country',
                            type: 'string',
                            required: true,
                            default: '',
                            description: 'Country code (e.g., DE, US, GB) - Required',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Group ID',
                            name: 'customerGroupId',
                            type: 'string',
                            default: '',
                            description: 'ID of the customer group',
                            displayOptions: {
                                show: {
                                    actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup'],
                                    customerGroupReferenceType: ['id'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Group IDs',
                            name: 'customerGroupIds',
                            type: 'string',
                            default: '',
                            description: 'Comma-separated list of customer group IDs',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
                                    customerGroupReferenceType: ['id'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Group Key',
                            name: 'customerGroupKey',
                            type: 'string',
                            default: '',
                            description: 'Key of the customer group',
                            displayOptions: {
                                show: {
                                    actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup'],
                                    customerGroupReferenceType: ['key'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Group Keys',
                            name: 'customerGroupKeys',
                            type: 'string',
                            default: '',
                            description: 'Comma-separated list of customer group keys',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
                                    customerGroupReferenceType: ['key'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Group Reference Type',
                            name: 'customerGroupReferenceType',
                            type: 'options',
                            options: [
                                {
                                    name: 'ID',
                                    value: 'id',
                                    description: 'Reference customer group by ID',
                                },
                                {
                                    name: 'Key',
                                    value: 'key',
                                    description: 'Reference customer group by key',
                                },
                        ],
                            default: 'id',
                            description: 'Whether to reference the customer group by ID or key',
                            displayOptions: {
                                show: {
                                    actionType: ['addCustomerGroupAssignment', 'removeCustomerGroupAssignment', 'setCustomerGroup', 'setCustomerGroupAssignments', 'addToCustomerGroup', 'removeFromCustomerGroup'],
                                },
                            },
                        },
                        {
                            displayName: 'Customer Number',
                            name: 'customerNumber',
                            type: 'string',
                            default: '',
                            description: 'Customer number for identification',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomerNumber'],
                                },
                            },
                        },
                        {
                            displayName: 'Date of Birth',
                            name: 'dateOfBirth',
                            type: 'dateTime',
                            default: '',
                            description: 'Customer date of birth',
                            displayOptions: {
                                show: {
                                    actionType: ['setDateOfBirth'],
                                },
                            },
                        },
                        {
                            displayName: 'Department',
                            name: 'department',
                            type: 'string',
                            default: '',
                            description: 'Department within building (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Email',
                            name: 'email',
                            type: 'string',
                            default: '',
                            placeholder: 'name@email.com',
                            description: 'New email address',
                            displayOptions: {
                                show: {
                                    actionType: ['changeEmail'],
                                },
                            },
                        },
                        {
                            displayName: 'External ID',
                            name: 'externalId',
                            type: 'string',
                            default: '',
                            description: 'External ID for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setExternalId'],
                                },
                            },
                        },
                        {
                            displayName: 'Fax',
                            name: 'fax',
                            type: 'string',
                            default: '',
                            description: 'Fax number (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Field Name',
                            name: 'name',
                            type: 'string',
                            required: true,
                            default: '',
                            description: 'Name of the Custom Field',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomField', 'setCustomFieldInAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Field Value',
                            name: 'value',
                            type: 'string',
                            default: '',
                            description: 'Value for the custom field (text, number, boolean, etc.)',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomField', 'setAddressCustomField'],
                                },
                            },
                        },
                        {
                            displayName: 'Fields',
                            name: 'fields',
                            type: 'fixedCollection',
                            default: {},
                            description: 'Custom field values',
                            typeOptions: {
                                multipleValues: true,
                            },
                            options: [
                                {
                                    displayName: 'Field',
                                    name: 'field',
                                    values: [
                                        {
                                            displayName: 'Name',
                                            name: 'name',
                                            type: 'string',
                                            default: '',
                                            description: 'The name of the custom field',
                                        },
                                        {
                                            displayName: 'Value',
                                            name: 'value',
                                            type: 'string',
                                            default: '',
                                            description: 'The value of the custom field',
                                        },
                                    ],
                                },
                            ],
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomType', 'setCustomTypeInAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'First Name',
                            name: 'firstName',
                            type: 'string',
                            default: '',
                            description: 'First name for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setFirstName'],
                                },
                            },
                        },
                        {
                            displayName: 'Key',
                            name: 'key',
                            type: 'string',
                            default: '',
                            description: 'Address key for identification (optional but recommended)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Last Name',
                            name: 'lastName',
                            type: 'string',
                            default: '',
                            description: 'Last name for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setLastName'],
                                },
                            },
                        },
                        {
                            displayName: 'Locale',
                            name: 'locale',
                            type: 'string',
                            default: '',
                            description: 'Locale for the customer (e.g., \'en-US\')',
                            displayOptions: {
                                show: {
                                    actionType: ['setLocale'],
                                },
                            },
                        },
                        {
                            displayName: 'Middle Name',
                            name: 'middleName',
                            type: 'string',
                            default: '',
                            description: 'Middle name of the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setMiddleName'],
                                },
                            },
                        },
                        {
                            displayName: 'Mobile',
                            name: 'mobile',
                            type: 'string',
                            default: '',
                            description: 'Mobile phone number (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'P.O. Box',
                            name: 'pOBox',
                            type: 'string',
                            default: '',
                            description: 'Post office box (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Password',
                            name: 'password',
                            type: 'string',
                            typeOptions: { password: true },
                            default: '',
                            description: 'Password (required when setting to Password mode)',
                            displayOptions: {
                                show: {
                                    actionType: ['setAuthenticationMode'],
                                    authMode: ['Password'],
                                },
                            },
                        },
                        {
                            displayName: 'Phone',
                            name: 'phone',
                            type: 'string',
                            default: '',
                            description: 'Phone number (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Postal Code',
                            name: 'postalCode',
                            type: 'string',
                            default: '',
                            description: 'Postal/ZIP code',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Salutation',
                            name: 'salutation',
                            type: 'string',
                            default: '',
                            description: 'Customer salutation (e.g., Mr., Mrs., Dr.)',
                            displayOptions: {
                                show: {
                                    actionType: ['setSalutation'],
                                },
                            },
                        },
                        {
                            displayName: 'State',
                            name: 'state',
                            type: 'string',
                            default: '',
                            description: 'State or region (optional)',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Store ID',
                            name: 'storeId',
                            type: 'string',
                            default: '',
                            description: 'ID of the store',
                            displayOptions: {
                                show: {
                                    actionType: ['addStore', 'removeStore'],
                                    storeReferenceType: ['id'],
                                },
                            },
                        },
                        {
                            displayName: 'Store IDs',
                            name: 'storeIds',
                            type: 'string',
                            displayOptions: {
                                show: {
                                    actionType: ['setStores'],
                                    storeReferenceType: ['id'],
                                },
                            },
                            default: '',
                            description: 'Comma-separated list of store IDs',
                        },
                        {
                            displayName: 'Store Key',
                            name: 'storeKey',
                            type: 'string',
                            default: '',
                            description: 'Key of the store',
                            displayOptions: {
                                show: {
                                    actionType: ['addStore', 'removeStore'],
                                    storeReferenceType: ['key'],
                                },
                            },
                        },
                        {
                            displayName: 'Store Keys',
                            name: 'storeKeys',
                            type: 'string',
                            displayOptions: {
                                show: {
                                    actionType: ['setStores'],
                                    storeReferenceType: ['key'],
                                },
                            },
                            default: '',
                            description: 'Comma-separated list of store keys',
                        },
                        {
                            displayName: 'Store Reference Type',
                            name: 'storeReferenceType',
                            type: 'options',
                            options: [
                                {
                                    name: 'ID',
                                    value: 'id',
                                    description: 'Reference store by ID',
                                },
                                {
                                    name: 'Key',
                                    value: 'key',
                                    description: 'Reference store by key',
                                },
                        ],
                            default: 'id',
                            description: 'Whether to reference the store by ID or key',
                            displayOptions: {
                                show: {
                                    actionType: ['addStore', 'removeStore', 'setStores'],
                                },
                            },
                        },
                        {
                            displayName: 'Street Name',
                            name: 'streetName',
                            type: 'string',
                            default: '',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Street Number',
                            name: 'streetNumber',
                            type: 'string',
                            default: '',
                            displayOptions: {
                                show: {
                                    actionType: ['addAddress', 'changeAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'Title',
                            name: 'title',
                            type: 'string',
                            default: '',
                            description: 'Customer title (e.g., Mr., Mrs., Dr.)',
                            displayOptions: {
                                show: {
                                    actionType: ['setTitle'],
                                },
                            },
                        },
                        {
                            displayName: 'Type ID',
                            name: 'typeId',
                            type: 'string',
                            default: '',
                            description: 'ID of the custom type',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomType', 'setCustomTypeInAddress'],
                                    typeReferenceType: ['id'],
                                },
                            },
                        },
                        {
                            displayName: 'Type Key',
                            name: 'typeKey',
                            type: 'string',
                            default: '',
                            description: 'Key of the custom type',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomType', 'setCustomTypeInAddress'],
                                    typeReferenceType: ['key'],
                                },
                            },
                        },
                        {
                            displayName: 'Type Reference Type',
                            name: 'typeReferenceType',
                            type: 'options',
                            options: [
                                {
                                    name: 'ID',
                                    value: 'id',
                                    description: 'Reference type by ID',
                                },
                                {
                                    name: 'Key',
                                    value: 'key',
                                    description: 'Reference type by key',
                                },
                        ],
                            default: 'key',
                            description: 'Whether to reference the custom type by ID or key',
                            displayOptions: {
                                show: {
                                    actionType: ['setCustomType', 'setCustomTypeInAddress'],
                                },
                            },
                        },
                        {
                            displayName: 'VAT ID',
                            name: 'vatId',
                            type: 'string',
                            default: '',
                            description: 'VAT ID for the customer',
                            displayOptions: {
                                show: {
                                    actionType: ['setVatId'],
                                },
                            },
                        },
                ],
                },
            ],
        },








        {
            displayName: 'Return All',
            name: 'returnAll',
            type: 'boolean',
            default: false,
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['query', 'queryInStore'],
                },
            },
            description: 'Whether to return all results or only up to a given limit',
        },
        {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 50,
            typeOptions: {
                minValue: 1,
                maxValue: 500,
            },
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['query', 'queryInStore'],
                    returnAll: [false],
                },
            },
            description: 'Max number of results to return',
        },
        {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            typeOptions: {
                minValue: 0,
            },
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['query', 'queryInStore'],
                },
            },
            description: 'Number of customers to skip before returning results',
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFields',
            type: 'collection',
            default: {},
            placeholder: 'Add Field',
            options: [
                {
                    displayName: 'Anonymous Cart ID',
                    name: 'anonymousCartId',
                    type: 'string',
                    default: '',
                    description: 'The ID of the anonymous cart to merge with the customer cart',
                },
                {
                    displayName: 'Anonymous Cart Sign In Mode',
                    name: 'anonymousCartSignInMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Merge With Existing Customer Cart',
                            value: 'MergeWithExistingCustomerCart',
                        },
                        {
                            name: 'Use As New Active Customer Cart',
                            value: 'UseAsNewActiveCustomerCart',
                        },
                    ],
                    default: 'MergeWithExistingCustomerCart',
                    description: 'How to handle the anonymous cart when signing in',
                },
                {
                    displayName: 'Anonymous ID',
                    name: 'anonymousId',
                    type: 'string',
                    default: '',
                    description: 'The ID of the anonymous session',
                },
                {
                    displayName: 'Custom Query Parameters',
                    name: 'customParameters',
                    type: 'fixedCollection',
                    default: {},
                    placeholder: 'Add Parameter',
                    typeOptions: {
                        multipleValues: true,
                    },
                    options: [
                        {
                            name: 'parameter',
                            displayName: 'Parameter',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Expand',
                    name: 'expand',
                    type: 'string',
                    default: '',
                    description: 'Include additional resources by reference expansion',
                },
                {
                    displayName: 'Predicate Variables',
                    name: 'predicateVariables',
                    type: 'fixedCollection',
                    default: {},
                    placeholder: 'Add Variable',
                    typeOptions: {
                        multipleValues: true,
                    },
                    options: [
                        {
                            name: 'variable',
                            displayName: 'Variable',
                            values: [
                                {
                                    displayName: 'Name',
                                    name: 'name',
                                    type: 'string',
                                    default: '',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Sort',
                    name: 'sort',
                    type: 'string',
                    default: '',
                    description: 'Sort customers by specific fields',
                },
                {
                    displayName: 'TTL Minutes',
                    name: 'ttlMinutes',
                    type: 'number',
                    default: 10080,
                    description: 'Time to live for tokens in minutes (default: 7 days)',
                },
                {
                    displayName: 'Update Product Data',
                    name: 'updateProductData',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to update product data in the cart',
                },
                {
                    displayName: 'Where',
                    name: 'where',
                    type: 'string',
                    default: '',
                    description: 'Query predicate to filter customers',
                },
                {
                    displayName: 'With Total',
                    name: 'withTotal',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to include total count in the response',
                },
            ],
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['authenticate', 'authenticateInStore', 'query', 'queryInStore', 'headByQuery', 'headInStoreByQuery', 'createPasswordResetToken', 'createPasswordResetTokenInStore', 'createEmailToken', 'createEmailTokenInStore'],
                },
            },
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFieldsGet',
            type: 'collection',
            default: {},
            placeholder: 'Add Field',
            options: [
                {
                    displayName: 'Expand',
                    name: 'expand',
                    type: 'string',
                    default: '',
                    description: 'Include additional resources by reference expansion',
                },
                {
                    displayName: 'Custom Query Parameters',
                    name: 'customParameters',
                    type: 'fixedCollection',
                    default: {},
                    placeholder: 'Add Parameter',
                    typeOptions: {
                        multipleValues: true,
                    },
                    options: [
                        {
                            name: 'parameter',
                            displayName: 'Parameter',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
                },
            ],
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['get', 'getByKey', 'getByEmailToken', 'getByPasswordToken', 'getInStore', 'getInStoreByKey', 'getInStoreByEmailToken', 'getInStoreByPasswordToken'],
                },
            },
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFieldsCreate',
            type: 'collection',
            default: {},
            placeholder: 'Add Field',
            options: [
                {
                    displayName: 'Expand',
                    name: 'expand',
                    type: 'string',
                    default: '',
                    description: 'Include additional resources by reference expansion',
                },
            ],
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['create', 'createInStore'],
                },
            },
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFieldsUpdate',
            type: 'collection',
            default: {},
            placeholder: 'Add Field',
            options: [
                {
                    displayName: 'Expand',
                    name: 'expand',
                    type: 'string',
                    default: '',
                    description: 'Include additional resources by reference expansion',
                },
            ],
            displayOptions: {
                show: {
                    resource: ['customer'],
                    operation: ['update', 'updateByKey', 'updateInStore', 'updateInStoreByKey'],
                },
            },
        },
];
