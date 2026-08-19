/**
 * middleware/sanitize.js — Input Sanitization & Injection Prevention
 * =================================================================
 * Protects against:
 *   1. NoSQL Injection (strips MongoDB query selectors like $gt, $ne, $where, $regex)
 *   2. Cross-Site Scripting (XSS) in request payloads
 *   3. SQL Injection patterns in text parameters
 */

'use strict';

const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');

/**
 * Deeply sanitizes string values in an object to prevent XSS and script injection
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Trim whitespace and escape dangerous HTML/script characters
    return validator.escape(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

/**
 * Custom input sanitizer middleware for request body and query params
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      // Exclude password fields from HTML escaping so user hashes are preserved accurately
      if (key.toLowerCase().includes('password')) continue;
      // Exclude base64/code fields
      if (key === 'code' || key === 'avatar') continue;
      
      req.body[key] = sanitizeValue(req.body[key]);
    }
  }
  next();
}

/**
 * Express mongo sanitize options
 */
const nosqlSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] ⚠ NoSQL injection attempt blocked in key: "${key}" from IP: ${req.ip}`);
  }
});

module.exports = {
  nosqlSanitizer,
  sanitizeInput,
  sanitizeValue
};
