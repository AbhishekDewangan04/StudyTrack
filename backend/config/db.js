const mongoose = require('mongoose');
const dns = require('dns');

/**
 * Global connection cache across serverless function invocations (Node.js global namespace)
 */
let cached = global._studytrack_mongoose;
if (!cached) {
  cached = global._studytrack_mongoose = {
    conn: null,
    promise: null,
    lastError: null,
  };
}

/**
 * Safely redact connection strings, credentials, and hostnames from diagnostic messages.
 */
function redactDiagnosticMessage(msg) {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    // Redact full mongodb or mongodb+srv URIs
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_URI]')
    // Redact user:password@ credentials
    .replace(/:\/\/[^@\s]+@/g, '://[REDACTED_CREDENTIALS]@')
    // Redact Atlas or MongoDB hostnames
    .replace(/[a-zA-Z0-9_\-\.]+\.(?:mongodb\.net|mlab\.com)/gi, '[REDACTED_HOST]')
    // Redact any password parameters in connection options
    .replace(/password=[^&;\s]+/gi, 'password=[REDACTED]');
}

/**
 * Safe runtime verification of MongoDB URI without exposing credentials or hosts.
 */
function getMongoUriMetadata() {
  const uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    return {
      configured: false,
      protocol: 'none',
      isPlaceholder: false,
      length: 0,
    };
  }
  const trimmed = uri.trim();
  const isPlaceholder =
    trimmed.includes('your_mongodb_atlas_connection_string_here') ||
    trimmed.includes('<username>') ||
    trimmed.includes('<password>');

  let protocol = 'unknown';
  if (trimmed.startsWith('mongodb+srv://')) {
    protocol = 'mongodb+srv';
  } else if (trimmed.startsWith('mongodb://')) {
    protocol = 'mongodb';
  }

  return {
    configured: !isPlaceholder,
    protocol,
    isPlaceholder,
    length: trimmed.length,
  };
}

/**
 * Configure DNS resolvers safely:
 * In cloud/serverless environments (Vercel, AWS Lambda, production), NEVER override DNS servers.
 * Overriding DNS in Vercel with external IPs (8.8.8.8) causes port 53 UDP timeouts because
 * serverless sandboxes require the internal cloud VPC resolver (e.g. Amazon Route 53).
 */
function configureDns() {
  const isServerlessOrProd = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === 'production'
  );

  if (isServerlessOrProd) {
    // Rely exclusively on host/VPC DNS resolvers in serverless/production
    return;
  }

  // Only allow public DNS override on local Windows development if explicitly enabled
  if (process.platform === 'win32' && process.env.FORCE_PUBLIC_DNS === 'true') {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      console.log('ℹ️ Configured public DNS servers for local Windows development');
    } catch (dnsErr) {
      console.warn('⚠️ Could not set DNS servers:', dnsErr.message);
    }
  }
}

/**
 * Safe connection diagnostics (error name/code/message only, credentials/hosts redacted).
 */
function getDBDiagnostics() {
  const meta = getMongoUriMetadata();
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: states[readyState] || 'unknown',
    readyState,
    uriConfigured: meta.configured,
    uriProtocol: meta.protocol,
    lastError: cached && cached.lastError ? cached.lastError : null,
  };
}

/**
 * Connect to MongoDB with serverless caching, connection reuse, and robust lifecycle handling.
 */
const connectDB = async () => {
  const meta = getMongoUriMetadata();

  if (!meta.configured) {
    const reason = meta.isPlaceholder
      ? 'MONGODB_URI contains placeholder credentials (<username>/<password>)'
      : 'MONGODB_URI is not configured in environment';
    cached.lastError = {
      name: 'ConfigurationError',
      code: 'ERR_MONGODB_URI_MISSING',
      message: reason,
      timestamp: new Date().toISOString(),
    };
    console.warn(`⚠️ MongoDB URI warning: ${reason}`);
    return null;
  }

  // 1. Serverless reuse: Return active connection if readyState is 1 (connected)
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // 2. Lifecycle reuse: Await in-flight connection promise if currently connecting
  if (cached.promise && mongoose.connection.readyState === 2) {
    try {
      const conn = await cached.promise;
      cached.conn = conn;
      return conn;
    } catch (err) {
      cached.promise = null;
      // Pending connection failed; fall through to retry
    }
  }

  // 3. Configure DNS safely (prevents breaking DNS on Vercel)
  configureDns();

  const connStr = process.env.MONGODB_URI;

  const connectionOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    bufferCommands: true,
  };

  cached.promise = mongoose
    .connect(connStr, connectionOptions)
    .then((m) => {
      cached.conn = mongoose.connection;
      cached.lastError = null;
      console.log('✅ MongoDB Connected successfully');
      return cached.conn;
    })
    .catch((error) => {
      // Store safe, redacted diagnostic information
      cached.lastError = {
        name: error.name || 'MongooseConnectionError',
        code: error.code || 'ERR_CONNECTION_FAILED',
        message: redactDiagnosticMessage(error.message),
        timestamp: new Date().toISOString(),
      };
      cached.promise = null;
      cached.conn = null;
      console.error(`❌ MongoDB Connection Error [${cached.lastError.name}]: ${cached.lastError.message}`);
      throw error;
    });

  try {
    return await cached.promise;
  } catch (error) {
    // Safe error handling; caller can inspect mongoose.connection.readyState
    return null;
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDBDiagnostics = getDBDiagnostics;
module.exports.redactDiagnosticMessage = redactDiagnosticMessage;
module.exports.getMongoUriMetadata = getMongoUriMetadata;
module.exports.configureDns = configureDns;
