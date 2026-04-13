import type { IHookFunctions } from 'n8n-workflow';
export declare const triggerMethods: {
    default: {
        checkExists: (this: IHookFunctions) => Promise<boolean>;
        create: (this: IHookFunctions) => Promise<boolean>;
        delete: (this: IHookFunctions) => Promise<boolean>;
    };
};
