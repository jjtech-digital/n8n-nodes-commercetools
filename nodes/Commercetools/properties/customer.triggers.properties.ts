import { INodeProperties } from "n8n-workflow";

export const customerTriggerProperties: INodeProperties[] = [
    {
        displayName: 'Events',
        name: 'customerEvents',
        type: 'multiOptions',
        noDataExpression: true,
        required: true,
        displayOptions: {
            show: {
                resource: ['customer'],
            },
        },
        options: [
            {
                name: 'Customer Address Added',
                value: 'CustomerAddressAdded',
                description: 'Triggered when a new address is added to a customer',
            },
            {
                name: 'Customer Address Changed',
                value: 'CustomerAddressChanged',
                description: 'Triggered when a customer address is changed',
            },
            {
                name: 'Customer Address Custom Field Added',
                value: 'CustomerAddressCustomFieldAdded',
                description: 'Triggered when a custom field is added to a customer address',
            },
            {
                name: 'Customer Address Custom Field Changed',
                value: 'CustomerAddressCustomFieldChanged',
                description: 'Triggered when a customer address custom field is changed',
            },
            {
                name: 'Customer Address Custom Field Removed',
                value: 'CustomerAddressCustomFieldRemoved',
                description: 'Triggered when a customer address custom field is removed',
            },
            {
                name: 'Customer Address Custom Type Removed',
                value: 'CustomerAddressCustomTypeRemoved',
                description: 'Triggered when a custom type is removed from a customer address',
            },
            {
                name: 'Customer Address Custom Type Set',
                value: 'CustomerAddressCustomTypeSet',
                description: 'Triggered when a custom type is set for a customer address',
            },
            {
                name: 'Customer Address Removed',
                value: 'CustomerAddressRemoved',
                description: 'Triggered when a customer address is removed',
            },
            {
                name: 'Customer Billing Address Added',
                value: 'CustomerBillingAddressAdded',
                description: 'Triggered when a billing address is added to a customer',
            },
            {
                name: 'Customer Billing Address Removed',
                value: 'CustomerBillingAddressRemoved',
                description: 'Triggered when a billing address is removed from a customer',
            },
            {
                name: 'Customer Company Name Set',
                value: 'CustomerCompanyNameSet',
                description: 'Triggered when a customer company name is set',
            },
            {
                name: 'Customer Created',
                value: 'CustomerCreated',
                description: 'Triggered when a new customer is created',
            },
            {
                name: 'Customer Custom Field Added',
                value: 'CustomerCustomFieldAdded',
                description: 'Triggered when a custom field is added to a customer',
            },
            {
                name: 'Customer Custom Field Changed',
                value: 'CustomerCustomFieldChanged',
                description: 'Triggered when a customer custom field is changed',
            },
            {
                name: 'Customer Custom Field Removed',
                value: 'CustomerCustomFieldRemoved',
                description: 'Triggered when a customer custom field is removed',
            },
            {
                name: 'Customer Custom Type Removed',
                value: 'CustomerCustomTypeRemoved',
                description: 'Triggered when a custom type is removed from a customer',
            },
            {
                name: 'Customer Custom Type Set',
                value: 'CustomerCustomTypeSet',
                description: 'Triggered when a custom type is set for a customer',
            },
            {
                name: 'Customer Date Of Birth Set',
                value: 'CustomerDateOfBirthSet',
                description: 'Triggered when a customer date of birth is set',
            },
            {
                name: 'Customer Default Billing Address Set',
                value: 'CustomerDefaultBillingAddressSet',
                description: 'Triggered when a default billing address is set for a customer',
            },
            {
                name: 'Customer Default Shipping Address Set',
                value: 'CustomerDefaultShippingAddressSet',
                description: 'Triggered when a default shipping address is set for a customer',
            },
            {
                name: 'Customer Deleted',
                value: 'CustomerDeleted',
                description: 'Triggered when a customer is deleted',
            },
            {
                name: 'Customer Email Changed',
                value: 'CustomerEmailChanged',
                description: 'Triggered when a customer email is changed',
            },
            {
                name: 'Customer Email Verified',
                value: 'CustomerEmailVerified',
                description: 'Triggered when a customer email is verified',
            },
            {
                name: 'Customer External ID Set',
                value: 'CustomerExternalIdSet',
                description: 'Triggered when a customer external ID is set',
            },
            {
                name: 'Customer First Name Set',
                value: 'CustomerFirstNameSet',
                description: 'Triggered when a customer first name is set',
            },
            {
                name: 'Customer Group Set',
                value: 'CustomerGroupSet',
                description: 'Triggered when a customer is assigned to a group',
            },
            {
                name: 'Customer Last Name Set',
                value: 'CustomerLastNameSet',
                description: 'Triggered when a customer last name is set',
            },
            {
                name: 'Customer Password Updated',
                value: 'CustomerPasswordUpdated',
                description: 'Triggered when a customer password is updated',
            },
            {
                name: 'Customer Shipping Address Added',
                value: 'CustomerShippingAddressAdded',
                description: 'Triggered when a shipping address is added to a customer',
            },
            {
                name: 'Customer Shipping Address Removed',
                value: 'CustomerShippingAddressRemoved',
                description: 'Triggered when a shipping address is removed from a customer',
            },
            {
                name: 'Customer Stores Set',
                value: 'CustomerStoresSet',
                description: 'Triggered when customer stores are set',
            },
            {
                name: 'Customer Title Set',
                value: 'CustomerTitleSet',
                description: 'Triggered when a customer title is set',
            },
        ],
        default: ['CustomerCreated'],
        description: 'Select which customer events should trigger this workflow',
    },
];