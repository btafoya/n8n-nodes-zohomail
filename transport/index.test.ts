import { describe, expect, test } from 'vitest';

import { getAuthBaseUrl, getBaseUrl, joinAddresses, normalizeReceivedTime, toArray } from './index';

describe('getBaseUrl', () => {
	test.each([
		['us', 'https://mail.zoho.com'],
		['eu', 'https://mail.zoho.eu'],
		['in', 'https://mail.zoho.in'],
		['au', 'https://mail.zoho.com.au'],
		['jp', 'https://mail.zoho.jp'],
		['ca', 'https://mail.zohocloud.ca'],
		['cn', 'https://mail.zoho.com.cn'],
		['ae', 'https://mail.zoho.ae'],
		['sa', 'https://mail.zoho.sa'],
	])('dataCenter %s → %s', (dc, expected) => {
		expect(getBaseUrl(dc as Parameters<typeof getBaseUrl>[0])).toBe(expected);
	});
});

describe('getAuthBaseUrl', () => {
	test.each([
		['us', 'https://accounts.zoho.com'],
		['eu', 'https://accounts.zoho.eu'],
		['ca', 'https://accounts.zohocloud.ca'],
	])('dataCenter %s → %s', (dc, expected) => {
		expect(getAuthBaseUrl(dc as Parameters<typeof getAuthBaseUrl>[0])).toBe(expected);
	});
});

describe('toArray', () => {
	test('returns an empty array for undefined/null', () => {
		expect(toArray(undefined)).toEqual([]);
		expect(toArray(null)).toEqual([]);
	});

	test('wraps a scalar in an array', () => {
		expect(toArray('a')).toEqual(['a']);
		expect(toArray(1)).toEqual([1]);
	});

	test('returns arrays unchanged', () => {
		expect(toArray(['a', 'b'])).toEqual(['a', 'b']);
	});
});

describe('joinAddresses', () => {
	test('joins arrays with commas', () => {
		expect(joinAddresses(['a@example.com', 'b@example.com'])).toBe('a@example.com, b@example.com');
	});

	test('returns strings unchanged', () => {
		expect(joinAddresses('a@example.com')).toBe('a@example.com');
	});

	test('returns undefined for empty inputs', () => {
		expect(joinAddresses(undefined)).toBeUndefined();
		expect(joinAddresses('')).toBe('');
	});
});

describe('normalizeReceivedTime', () => {
	test('passes numbers through', () => {
		expect(normalizeReceivedTime(123456789)).toBe(123456789);
	});

	test('passes strings through', () => {
		expect(normalizeReceivedTime('123456789')).toBe('123456789');
	});

	test('returns undefined for missing or invalid values', () => {
		expect(normalizeReceivedTime(undefined)).toBeUndefined();
		expect(normalizeReceivedTime(null)).toBeUndefined();
		expect(normalizeReceivedTime({})).toBeUndefined();
	});
});
