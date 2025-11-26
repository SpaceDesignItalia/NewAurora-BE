// configs/Redis.js
const redis = require("redis");
require("dotenv").config();

/**
 * Crea e configura il client Redis per le sessioni
 * 
 * Supporta due modalità:
 * 1. URL Redis (priorità): REDIS_URL (es. "redis://redis-session:6379")
 * 2. Configurazione manuale:
 *    - REDIS_HOST: Host Redis (default: "localhost" o "redis-session" in Docker)
 *    - REDIS_PORT: Porta Redis (default: 6379)
 *    - REDIS_PASSWORD: Password Redis (opzionale)
 *    - REDIS_TLS: "true" per abilitare TLS (opzionale)
 * 
 * Esempio .env per Docker:
 * REDIS_URL=redis://redis-session:6379
 * 
 * Esempio .env per configurazione manuale:
 * REDIS_HOST=redis-session
 * REDIS_PORT=6379
 * REDIS_PASSWORD=your-password-here
 * REDIS_TLS=false
 * 
 * @param {Object} options - Opzioni opzionali (per compatibilità)
 * @param {string} options.url - URL Redis (alternativa a REDIS_URL env)
 * @returns {Promise<redis.RedisClientType>} Client Redis configurato
 */
async function createRedisClient(options = {}) {
  let redisConfig;

  // Priorità 1: URL Redis (da parametro o variabile d'ambiente)
  const redisUrl = options.url || process.env.REDIS_URL;
  
  if (redisUrl) {
    redisConfig = {
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Troppi tentativi di riconnessione a Redis, interruzione");
            return new Error("Troppi tentativi di riconnessione");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    };
  } else {
    // Priorità 2: Configurazione manuale
    // In Docker, usa il nome del servizio come default
    const defaultHost = process.env.ENVIRONMENT === "development" 
      ? "localhost" 
      : (process.env.REDIS_HOST || "redis-session");
    
    redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || defaultHost,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Troppi tentativi di riconnessione a Redis, interruzione");
            return new Error("Troppi tentativi di riconnessione");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    };

    // Aggiungi password se presente
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    // Aggiungi TLS se necessario (per Redis Cloud o produzione)
    if (process.env.REDIS_TLS === "true") {
      redisConfig.socket.tls = true;
      redisConfig.socket.rejectUnauthorized = false;
    }
  }

  const client = redis.createClient(redisConfig);

  // Gestione errori
  client.on("error", (err) => {
    console.error("Errore Redis Client:", err);
  });

  client.on("connect", () => {
    console.log("✅ Connesso a Redis");
  });

  client.on("reconnecting", () => {
    console.log("🔄 Riconnessione a Redis...");
  });

  client.on("ready", () => {
    console.log("✅ Redis pronto");
  });

  // Connetti al client
  await client.connect();

  return client;
}

module.exports = { createRedisClient };

