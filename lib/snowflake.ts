import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

snowflake.configure({ logLevel: 'ERROR' });

let connection: snowflake.Connection | null = null;
let connectionPromise: Promise<snowflake.Connection> | null = null;
let cachedToken: string | null = null;

interface TomlConnection {
  account?: string;
  user?: string;
  authenticator?: string;
  warehouse?: string;
  database?: string;
  schema?: string;
  role?: string;
}

function parseTomlConnection(content: string, connectionName: string): TomlConnection {
  const result: TomlConnection = {};
  const connectionKey = `[connections.${connectionName}]`;
  const startIndex = content.indexOf(connectionKey);
  if (startIndex === -1) return result;

  const afterSection = content.substring(startIndex + connectionKey.length);
  const nextSectionMatch = afterSection.match(/\n\s*\[/);
  const sectionContent = nextSectionMatch 
    ? afterSection.substring(0, nextSectionMatch.index)
    : afterSection;

  const lines = sectionContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\w+)\s*=\s*"?([^"\n]+)"?\s*$/);
    if (match) {
      const [, key, value] = match;
      (result as Record<string, string>)[key] = value.trim().replace(/^"|"$/g, '');
    }
  }
  return result;
}

function getSnowflakeConfig(): TomlConnection {
  const configPath = path.join(os.homedir(), '.snowflake', 'config.toml');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const connectionName = process.env.SNOWFLAKE_CONNECTION_NAME || 'pm';
      return parseTomlConnection(content, connectionName);
    }
  } catch (err) {
    console.warn('Could not read Snowflake config:', (err as Error).message);
  }
  return {};
}

function getOAuthToken(): string | null {
  const tokenPath = '/snowflake/session/token';
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8');
    }
  } catch {
    // Not in SPCS environment
  }
  return null;
}

function getConfig(): snowflake.ConnectionOptions {
  const tomlConfig = getSnowflakeConfig();
  
  const base = {
    account: process.env.SNOWFLAKE_ACCOUNT || tomlConfig.account || 'pm',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || tomlConfig.warehouse || 'HLEVEL1',
    database: process.env.SNOWFLAKE_DATABASE || 'CUSTOMER_360_DB',
    schema: process.env.SNOWFLAKE_SCHEMA || 'ANALYTICS',
  };

  const token = getOAuthToken();
  if (token) {
    return {
      ...base,
      host: process.env.SNOWFLAKE_HOST,
      token,
      authenticator: 'oauth',
    };
  }

  return {
    ...base,
    username: process.env.SNOWFLAKE_USER || tomlConfig.user || 'ujagtap',
    authenticator: (tomlConfig.authenticator?.toUpperCase() || 'EXTERNALBROWSER') as string,
  };
}

async function getConnection(): Promise<snowflake.Connection> {
  const token = getOAuthToken();

  if (connection && (!token || token === cachedToken)) {
    return connection;
  }

  if (connectionPromise && (!token || token === cachedToken)) {
    return connectionPromise;
  }

  if (connection) {
    console.log('OAuth token changed, reconnecting');
    connection.destroy(() => {});
    connection = null;
  }

  connectionPromise = (async () => {
    const config = getConfig();
    console.log(`Connecting to Snowflake account: ${config.account}, authenticator: ${config.authenticator}`);
    const conn = snowflake.createConnection(config);
    await conn.connectAsync(() => {});
    connection = conn;
    cachedToken = token;
    return conn;
  })();

  try {
    return await connectionPromise;
  } finally {
    connectionPromise = null;
  }
}

function isRetryableError(err: unknown): boolean {
  const error = err as { message?: string; code?: number };
  return !!(
    error.message?.includes('OAuth access token expired') ||
    error.message?.includes('terminated connection') ||
    error.code === 407002
  );
}

export async function query<T>(sql: string, retries = 1): Promise<T[]> {
  try {
    const conn = await getConnection();
    return await new Promise<T[]>((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve((rows || []) as T[]);
          }
        },
      });
    });
  } catch (err) {
    console.error('Query error:', (err as Error).message);
    if (retries > 0 && isRetryableError(err)) {
      connection = null;
      return query(sql, retries - 1);
    }
    throw err;
  }
}
