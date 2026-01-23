import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type CommonParameterOptions = {
  allowSort?: boolean;
  allowWhere?: boolean;
  allowPredicateVariables?: boolean;
};

export const applyCommonParameters = (
  qs: IDataObject,
  additionalFields: IDataObject = {},
  options: CommonParameterOptions = {},
) => {
  const setArrayField = (fieldName: string, queryName: string) => {
    const value = additionalFields[fieldName];
    if (Array.isArray(value) && value.length) {
      qs[queryName] = value;
    } else if (typeof value === 'string' && value.trim()) {
      const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
      if (arrayValue.length) {
        qs[queryName] = arrayValue;
      }
    }
  };

  const setValueField = (fieldName: string, queryName: string) => {
    const value = additionalFields[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      qs[queryName] = value;
    }
  };

  setArrayField('expand', 'expand');

  if (options.allowSort) {
    setArrayField('sort', 'sort');
  }

  if (options.allowWhere) {
    setArrayField('where', 'where');
  }

  setArrayField('localeProjection', 'localeProjection');
  setArrayField('storeProjection', 'storeProjection');

  if (Object.prototype.hasOwnProperty.call(additionalFields, 'staged')) {
    qs.staged = additionalFields.staged as boolean;
  }

  setValueField('priceCurrency', 'priceCurrency');
  setValueField('priceCountry', 'priceCountry');
  setValueField('priceCustomerGroup', 'priceCustomerGroup');
  setValueField('priceChannel', 'priceChannel');

  if (options.allowPredicateVariables) {
    const predicateVariables = ((additionalFields.predicateVariables as IDataObject)?.variable ?? []) as IDataObject[];
    for (const predicateVariable of predicateVariables) {
      const name = predicateVariable.name as string;
      if (!name) continue;
      qs[`var.${name}`] = predicateVariable.value as string;
    }
  }

  const customParameters = ((additionalFields.customParameters as IDataObject)?.parameter ?? []) as IDataObject[];
  for (const customParameter of customParameters) {
    const key = customParameter.key as string;
    if (!key) continue;
    qs[key] = customParameter.value as string;
  }
};

/**
 * Recursively transforms any property named 'name', 'description', 'slug', etc. containing a localizedField array into a locale-keyed object.
 */
export function preprocessLocalizedFields(obj: IDataObject): IDataObject {
  function transform(value: IDataObject | IDataObject[]): IDataObject | IDataObject[] {
    if (Array.isArray(value)) {
      return value.map((entry) => (entry && typeof entry === 'object' ? transform(entry) : entry)) as IDataObject | IDataObject[];
    }

    if (value && typeof value === 'object') {
      const newObj: IDataObject = {};
      for (const key of Object.keys(value)) {
        const currentValue = value[key];

        if (currentValue && typeof currentValue === 'object' && 'localizedField' in currentValue) {
          const localizedArr = currentValue.localizedField;
          if (Array.isArray(localizedArr)) {
            newObj[key] = {};
            for (const loc of localizedArr) {
              if (loc && typeof loc === 'object') {
                const locale = typeof loc.locale === 'string' ? loc.locale.trim() : '';
                const val = loc.value;
                if (locale && val !== undefined && val !== null) {
                  (newObj[key] as IDataObject)[locale] = val;
                }
              }
            }
          } else {
            newObj[key] = currentValue;
          }
        } else {
          newObj[key] = transform(currentValue as IDataObject | IDataObject[]);
        }
      }
      return newObj;
    }

    return value;
  }
  return transform(obj) as IDataObject;
}

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const buildCustomTypeFields = (fieldsInput: unknown): IDataObject => {
  const flatFields: IDataObject = {};

  if (!fieldsInput) {
    return flatFields;
  }

  if (typeof fieldsInput === 'string') {
    const trimmed = fieldsInput.trim();
    if (!trimmed) {
      return flatFields;
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as IDataObject;
      }
    } catch {
      throw new Error('Fields must be a valid JSON object');
    }
  }

  if (
    typeof fieldsInput === 'object' &&
    'name' in (fieldsInput as IDataObject) &&
    'value' in (fieldsInput as IDataObject)
  ) {
    const fieldName = (fieldsInput as IDataObject).name as string;
    const fieldValue = (fieldsInput as IDataObject).value;
    if (fieldName) {
      flatFields[fieldName] = fieldValue;
    }
    return flatFields;
  }

  if (
    typeof fieldsInput === 'object' &&
    'field' in (fieldsInput as IDataObject) &&
    Array.isArray((fieldsInput as IDataObject).field)
  ) {
    const fieldArray = (fieldsInput as IDataObject).field as IDataObject[];
    for (const fieldItem of fieldArray) {
      if (fieldItem && typeof fieldItem === 'object' && 'name' in fieldItem && 'value' in fieldItem) {
        const fieldName = fieldItem.name as string;
        const fieldValue = fieldItem.value;
        if (fieldName) {
          flatFields[fieldName] = fieldValue;
        }
      }
    }
  }

  return flatFields;
};

export const buildCustomTypeRef = (typeInput: unknown): IDataObject | undefined => {
  if (!typeInput) {
    return undefined;
  }

  if (typeof typeInput === 'string') {
    const trimmed = typeInput.trim();
    if (!trimmed) {
      return undefined;
    }
    if (isUuid(trimmed)) {
      return { id: trimmed, typeId: 'type' };
    }
    return { key: trimmed, typeId: 'type' };
  }

  if (
    typeof typeInput === 'object' &&
    'typeReference' in (typeInput as IDataObject) &&
    typeof (typeInput as IDataObject).typeReference === 'object'
  ) {
    const typeRef = (typeInput as IDataObject).typeReference as IDataObject;
    const id = typeof typeRef.id === 'string' ? typeRef.id : '';
    if (!id) {
      return undefined;
    }
    return {
      id,
      typeId: typeof typeRef.typeId === 'string' ? typeRef.typeId : 'type',
    };
  }

  if (typeof typeInput === 'object' && 'id' in (typeInput as IDataObject)) {
    const id = String((typeInput as IDataObject).id ?? '').trim();
    if (!id) {
      return undefined;
    }
    const typeId = typeof (typeInput as IDataObject).typeId === 'string'
      ? (typeInput as IDataObject).typeId
      : 'type';
    return { id, typeId };
  }

  if (typeof typeInput === 'object' && 'key' in (typeInput as IDataObject)) {
    const key = String((typeInput as IDataObject).key ?? '').trim();
    if (!key) {
      return undefined;
    }
    const typeId = typeof (typeInput as IDataObject).typeId === 'string'
      ? (typeInput as IDataObject).typeId
      : 'type';
    return { key, typeId };
  }

  return undefined;
};

export const coerceActions = (context: IExecuteFunctions, rawActions: unknown, itemIndex: number): IDataObject[] => {
  let actions = rawActions;

  if (typeof actions === 'string') {
    try {
      actions = JSON.parse(actions);
    } catch {
      throw new NodeOperationError(
        context.getNode(),
        'Actions must be valid JSON when provided as a string',
        { itemIndex },
      );
    }
  }

  if (!Array.isArray(actions)) {
    throw new NodeOperationError(context.getNode(), 'Actions must be provided as an array', {
      itemIndex,
    });
  }

  for (const action of actions as unknown[]) {
    if (typeof action !== 'object' || action === null || Array.isArray(action)) {
      throw new NodeOperationError(context.getNode(), 'Each update action must be an object', {
        itemIndex,
      });
    }
  }

  return actions as IDataObject[];
};

export const coerceJsonInput = (
  context: IExecuteFunctions,
  raw: unknown,
  label: string,
  itemIndex: number,
): IDataObject => {
  let value = raw;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      throw new NodeOperationError(
        context.getNode(),
        `${label} must be valid JSON when provided as a string`,
        { itemIndex },
      );
    }
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new NodeOperationError(context.getNode(), `${label} must be a JSON object`, {
      itemIndex,
    });
  }

  return value as IDataObject;
};