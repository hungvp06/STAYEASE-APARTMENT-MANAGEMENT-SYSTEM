/**
 * Naming Convention Transformation Utilities
 *
 * Transforms between camelCase (Database) and snake_case (API/Frontend)
 *
 * @see NAMING_CONVENTION_STANDARD.md
 */

/**
 * Convert camelCase string to snake_case
 *
 * @example
 * toSnakeCase('fullName') // 'full_name'
 * toSnakeCase('apartmentId') // 'apartment_id'
 * toSnakeCase('createdAt') // 'created_at'
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case string to camelCase
 *
 * @example
 * toCamelCase('full_name') // 'fullName'
 * toCamelCase('apartment_id') // 'apartmentId'
 * toCamelCase('created_at') // 'createdAt'
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform all object keys from camelCase to snake_case
 * Recursively transforms nested objects and arrays
 *
 * @example
 * objectToSnakeCase({ fullName: 'John', apartmentId: '123' })
 * // { full_name: 'John', apartment_id: '123' }
 */
export function objectToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToSnakeCase(item)) as any;
  }

  // Handle Date objects (don't transform)
  if (obj instanceof Date) {
    return obj as T;
  }

  // Handle plain objects
  if (typeof obj === "object" && obj.constructor === Object) {
    const result: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = toSnakeCase(key);
        result[snakeKey] = objectToSnakeCase(obj[key]);
      }
    }

    return result;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Transform all object keys from snake_case to camelCase
 * Recursively transforms nested objects and arrays
 *
 * @example
 * objectToCamelCase({ full_name: 'John', apartment_id: '123' })
 * // { fullName: 'John', apartmentId: '123' }
 */
export function objectToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToCamelCase(item)) as any;
  }

  // Handle Date objects (don't transform)
  if (obj instanceof Date) {
    return obj as T;
  }

  // Handle plain objects
  if (typeof obj === "object" && obj.constructor === Object) {
    const result: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        result[camelKey] = objectToCamelCase(obj[key]);
      }
    }

    return result;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Transform Mongoose document to API response format
 * - Converts _id to id
 * - Converts all camelCase keys to snake_case
 * - Converts ObjectId to string
 * - Converts Date to ISO string
 *
 * @example
 * const doc = {
 *   _id: new ObjectId(),
 *   fullName: 'John',
 *   createdAt: new Date()
 * }
 *
 * mongooseToApi(doc)
 * // {
 * //   id: '507f1f77bcf86cd799439011',
 * //   full_name: 'John',
 * //   created_at: '2025-01-23T10:00:00.000Z'
 * // }
 */
export function mongooseToApi<T = any>(doc: any): T {
  if (!doc) return doc;

  // Convert to plain object if Mongoose doc
  const plain = doc.toObject ? doc.toObject() : doc;

  // Transform special MongoDB/Mongoose fields
  const transformed: any = {};

  for (const key in plain) {
    if (!plain.hasOwnProperty(key)) continue;

    const value = plain[key];

    // Skip __v and other Mongoose internals
    if (key.startsWith("__") || key.startsWith("$")) continue;

    // Transform _id to id
    if (key === "_id") {
      transformed.id = value?.toString ? value.toString() : value;
      continue;
    }

    // Convert ObjectId to string
    if (value?.constructor?.name === "ObjectId") {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = value.toString();
      continue;
    }

    // Convert Date to ISO string
    if (value instanceof Date) {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = value.toISOString();
      continue;
    }

    // Handle nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = mongooseToApi(value);
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const snakeKey = toSnakeCase(key);
      transformed[snakeKey] = value.map((item) => {
        if (item && typeof item === "object") {
          return mongooseToApi(item);
        }
        return item;
      });
      continue;
    }

    // Regular fields
    const snakeKey = toSnakeCase(key);
    transformed[snakeKey] = value;
  }

  return transformed as T;
}

/**
 * Transform API request to Mongoose format
 * - Converts snake_case to camelCase
 * - Keeps Date strings as-is (Mongoose will convert)
 *
 * @example
 * const request = {
 *   full_name: 'John',
 *   apartment_id: '123',
 *   due_date: '2025-02-01'
 * }
 *
 * apiToMongoose(request)
 * // {
 * //   fullName: 'John',
 * //   apartmentId: '123',
 * //   dueDate: '2025-02-01'
 * // }
 */
export function apiToMongoose<T = any>(data: any): T {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => apiToMongoose(item)) as any;
  }

  if (typeof data !== "object") {
    return data;
  }

  const result: any = {};

  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue;

    const camelKey = toCamelCase(key);
    const value = data[key];

    // Handle nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[camelKey] = apiToMongoose(value);
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) => {
        if (item && typeof item === "object") {
          return apiToMongoose(item);
        }
        return item;
      });
    }
    // Regular values
    else {
      result[camelKey] = value;
    }
  }

  return result as T;
}

/**
 * Batch transform Mongoose documents to API format
 *
 * @example
 * const users = await User.find().lean()
 * const apiUsers = mongooseArrayToApi(users)
 */
export function mongooseArrayToApi<T = any>(docs: any[]): T[] {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc) => mongooseToApi<T>(doc));
}
