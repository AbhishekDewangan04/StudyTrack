const { AsyncLocalStorage } = require('async_hooks');

// Shared AsyncLocalStorage instance to track request-level test environment state
const testContextStorage = new AsyncLocalStorage();

/**
 * Determines whether the current execution context is in a test environment.
 * Checks process environment flags, explicit function parameters, and request-scoped context.
 */
const isTestEnvironment = (options = {}) => {
  // 1. Check process environment flags
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.TEST_MODE === 'true' ||
    process.env.SUPPRESS_EMAILS === 'true'
  ) {
    return true;
  }

  // 2. Check explicit options parameter
  if (options && (options.isTest || options.isTestMode)) {
    return true;
  }

  // 3. Check request-scoped AsyncLocalStorage context
  const store = testContextStorage.getStore();
  if (store && store.isTest) {
    return true;
  }

  return false;
};

module.exports = {
  testContextStorage,
  isTestEnvironment,
};
