/**
 * scripts/collection/postmanTypes.ts
 *
 * Minimal typed shapes for Postman Collection v2.1 JSON.
 * Replaces all `any` casts and eslint-disable comments in the parser.
 */

export interface PostmanUrl {
	raw?: string;
	query?: Array<{ key?: string; disabled?: boolean }>;
}

export interface PostmanBody {
	raw?: string | unknown;
}

export interface PostmanDescription {
	content?: string;
}

export interface PostmanRequest {
	method?: string;
	url?: string | PostmanUrl;
	body?: PostmanBody;
	description?: string | PostmanDescription;
}

export interface PostmanItem {
	name: string;
	item?: PostmanItem[];
	request?: PostmanRequest;
}

export interface PostmanCollection {
	item: PostmanItem[];
}
