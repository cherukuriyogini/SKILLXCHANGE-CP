/**
 * lib/asyncPatterns.js — Core JavaScript Async & Event Loop Utilities
 * ===================================================================
 * Demonstrates and implements fundamental JavaScript runtime concepts:
 *   1. Event Loop Task Scheduling (Macrotasks vs Microtasks)
 *   2. Promises vs Callbacks interop (promisify, callbackify)
 *   3. Hoisting-safe function initialization & scoping
 */

// ── 1. Event Loop Management ──────────────────────────────────────────────────

/**
 * Schedules a callback into the JavaScript Microtask queue.
 * Microtasks execute immediately after the current synchronous script and before
 * the Event Loop yields to the macrotask queue or browser rendering.
 * @param {Function} callback
 */
export function scheduleMicrotask(callback) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback).catch((err) => {
      setTimeout(() => { throw err; }, 0);
    });
  }
}

/**
 * Schedules a callback into the JavaScript Macrotask (Task) queue.
 * Macrotasks allow the browser Event Loop to handle rendering and I/O between tasks.
 * @param {Function} callback
 * @param {number} delayMs
 * @returns {number} Timer ID
 */
export function scheduleMacrotask(callback, delayMs = 0) {
  return setTimeout(callback, delayMs);
}

/**
 * Yields execution back to the browser Event Loop to prevent UI blocking
 * during long-running computations.
 * @returns {Promise<void>}
 */
export function yieldToEventLoop() {
  return new Promise((resolve) => {
    scheduleMacrotask(resolve, 0);
  });
}

// ── 2. Promises vs Callbacks Interoperability ──────────────────────────────────

/**
 * Converts a legacy error-first callback function into a modern Promise-based function.
 * @param {Function} callbackFn - (args..., (err, result) => void) => void
 * @returns {(...args: any[]) => Promise<any>}
 */
export function promisify(callbackFn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      callbackFn(...args, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  };
}

/**
 * Converts a modern Promise-returning async function into a legacy callback-style function.
 * @param {Function} asyncFn - (...args) => Promise<any>
 * @returns {(...args: any[]) => void}
 */
export function callbackify(asyncFn) {
  return function (...args) {
    const callback = args.pop();
    if (typeof callback !== 'function') {
      throw new TypeError('Last argument must be a callback function');
    }
    asyncFn(...args)
      .then((res) => callback(null, res))
      .catch((err) => callback(err));
  };
}

/**
 * Wraps a promise with a timeout rejection.
 * @param {Promise<any>} promise
 * @param {number} timeoutMs
 * @param {string} errorMsg
 */
export function withTimeout(promise, timeoutMs = 5000, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
    })
  ]);
}

// ── 3. Hoisting & Variable Scoping Demonstration ──────────────────────────────

/**
 * Hoisted Function Declaration:
 * In JavaScript, function declarations are hoisted to the top of their enclosing scope
 * with both name and definition initialized before code execution starts.
 */
export function getSafeHoistedValue(key, fallback = null) {
  return resolveConfigValue(key) ?? fallback;
}

/**
 * Function hoisted and accessible anywhere in this file.
 */
function resolveConfigValue(key) {
  // Accesses module configuration safely
  try {
    return window?.sessionStorage?.getItem(key);
  } catch {
    return null;
  }
}
