/**
 * =============================================================================
 * JavaScript Core Concepts Implementation (Frontend)
 * =============================================================================
 * Covers:
 *   1. Event Loop (Macrotasks vs Microtasks)
 *   2. Promises vs Callbacks
 *   3. Hoisting (Variable vs Function declaration hoisting)
 */

// ── 1. JavaScript — Event Loop ────────────────────────────────────────────────
/**
 * Demonstrates the JavaScript Event Loop execution order:
 * Synchronous Code -> Microtask Queue (Promises, queueMicrotask) -> Macrotask Queue (setTimeout)
 */
export function demonstrateEventLoop(onLog = console.log) {
  onLog('1. Synchronous: Start of Event Loop demonstration');

  // Macrotask (executed in next event loop tick after rendering)
  setTimeout(() => {
    onLog('4. Macrotask: setTimeout callback executed');
  }, 0);

  // Microtask (executed immediately after current call stack before next macrotask)
  queueMicrotask(() => {
    onLog('3. Microtask: queueMicrotask callback executed');
  });

  Promise.resolve().then(() => {
    onLog('2. Microtask: Promise.then executed before macrotasks');
  });

  return 'Event Loop demonstration queued';
}

// ── 2. JavaScript — Promises vs Callbacks ──────────────────────────────────────
/**
 * Callback-based asynchronous function
 * @param {string} data
 * @param {Function} callback (err, result)
 */
export function fetchDataCallback(data, callback) {
  setTimeout(() => {
    if (!data) {
      return callback(new Error('Data required in callback'));
    }
    callback(null, `Processed callback: ${data}`);
  }, 10);
}

/**
 * Promise-based asynchronous function (modern alternative to callbacks)
 * @param {string} data
 * @returns {Promise<string>}
 */
export function fetchDataPromise(data) {
  return new Promise((resolve, reject) => {
    fetchDataCallback(data, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Utility to convert any error-first callback function to a Promise
 */
export function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, res) => (err ? reject(err) : resolve(res)));
    });
}

// ── 3. JavaScript — Hoisting ──────────────────────────────────────────────────
/**
 * Demonstrates Hoisting in JavaScript:
 * - Function declarations are fully hoisted (can be called before definition)
 * - 'var' declarations are hoisted with 'undefined' initialization
 * - 'let' and 'const' are hoisted but remain in the Temporal Dead Zone (TDZ)
 */
export function demonstrateHoisting() {
  // Hoisted function call (declared below)
  const functionResult = hoistedFunction();

  // 'var' hoisting demonstration: variable exists before declaration as undefined
  var hoistedVar = 'I was declared with var';

  function hoistedFunction() {
    return 'Function declaration is hoisted to the top of scope';
  }

  return {
    functionResult,
    hoistedVar
  };
}
