const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
// connect-redis v9 usa named export
const { RedisStore } = require("connect-redis");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { createRedisClient } = require("./configs/Redis");
require("dotenv").config();

// Estendi il prototipo BigInt per supportare la serializzazione JSON
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Importa le route
const AuthenticationRoutes = require("./routes/authentication/Authentication");
const ProjectRoutes = require("./routes/project/Project");
const GitHubRoutes = require("./routes/github/GitHub");

const credentials = {
  key: fs.readFileSync("SSL/privateKey.key"),
  cert: fs.readFileSync("SSL/SpaceDesignAurora.pem"),
};

const app = express();
app.use(express.static("public"));
// Servi anche le immagini profilo dalla cartella uploads
app.use("/uploads", express.static("uploads"));
const PREFIX = "/API/v1";
const PORT = 3000; // Porta standard per HTTPS

// Database non più necessario con Prisma

// Configura CORS
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://spacedesign-italia.it",
      "https://app.spacedesign-italia.it",
      "https://www.spacedesign-italia.it",
      "https://api.spacedesign-italia.it",
      "https://api.spacedesign-italia.it:3000",
    ], // Aggiorna con gli URL HTTPS
    credentials: true,
  })
);

// Gestisci richieste preflight OPTIONS
app.options("*", cors());

// Middleware
app.use(bodyParser.json());

// Inizializza Redis e configura session store
(async () => {
  try {
    const redisClient = await createRedisClient({
      url: process.env.REDIS_URL,
    });

    // Configura session store con Redis
    app.use(
      session({
        store: new RedisStore({
          client: redisClient,
          prefix: "sess:",
        }),
        secret: process.env.ENCRYPT_KEY,
        saveUninitialized: false,
        resave: false,
        cookie: {
          maxAge: 60 * 60 * 1000, // 1 ora
          secure: process.env.ENVIRONMENT !== "development", // HTTPS solo in produzione
          httpOnly: true,
          sameSite: process.env.ENVIRONMENT === "development" ? "lax" : "none",
        },
      })
    );

    app.use(cookieParser());

    // Avvia il server dopo che Redis è configurato
    startServer();
  } catch (error) {
    console.error("❌ Errore nell'inizializzazione di Redis:", error);
    console.error("⚠️  Il server continuerà senza Redis (sessioni in memoria)");

    // Fallback a sessioni in memoria se Redis non è disponibile
    app.use(
      session({
        secret: process.env.ENCRYPT_KEY,
        saveUninitialized: false,
        resave: false,
        cookie: {
          maxAge: 60 * 60 * 1000,
        },
      })
    );

    app.use(cookieParser());
    startServer();
  }
})();

function startServer() {
  // Crea il server HTTPS
  let server;
  if (process.env.ENVIRONMENT === "development") {
    server = http.createServer(app);
  } else {
    server = https.createServer(credentials, app);
  }

  // Definisci le route principali
  app.use(PREFIX + "/authentication", AuthenticationRoutes());
  app.use(PREFIX + "/project", ProjectRoutes());
  app.use(PREFIX + "/github", GitHubRoutes());

  // Avvia il server HTTPS sulla porta 443
  (async () => {
    const chalk = (await import("chalk")).default;

    const BOX_WIDTH = 50;

    // Funzione per creare una box chiusa con bordi superiori, laterali e inferiori
    const createBox = (title, port, environment) => {
      const borderTop = "╔" + "═".repeat(BOX_WIDTH - 2) + "╗";
      const borderBottom = "╚" + "═".repeat(BOX_WIDTH - 2) + "╝";
      const padding = BOX_WIDTH - 4;

      const titleLine = `║ ${title
        .padStart((padding + title.length) / 2, " ")
        .padEnd(padding, " ")} ║`;

      const portLine = `║ ${`Porta: ${port}`
        .padStart((padding + `Porta: ${port}`.length) / 2, " ")
        .padEnd(padding, " ")} ║`;

      const environmentLine = `║ ${`Ambiente: ${environment}`
        .padStart((padding + `Ambiente: ${environment}`.length) / 2, " ")
        .padEnd(padding, " ")} ║`;

      const poweredByLine = `║ ${"Powered By 🚀 Space Design Italia "
        .padStart(
          (padding + "Powered By 🚀 Space Design Italia".length) / 2,
          " "
        )
        .padEnd(padding, " ")} ║`;

      return `\n${chalk.white(borderTop)}\n${chalk.whiteBright(
        titleLine
      )}\n${chalk.greenBright(portLine)}\n${chalk.yellowBright(
        environmentLine
      )}\n${chalk.cyanBright(poweredByLine)}\n${chalk.white(borderBottom)}`;
    };

    // Ambiente di sviluppo o produzione
    const environment =
      process.env.ENVIRONMENT === "development" ? "DEVELOPMENT" : "PRODUCTION";

    if (process.env.ENVIRONMENT === "development") {
      server.listen(PORT, () => {
        console.log(createBox("🚧 DEVELOPMENT Server", PORT, environment));
      });
    } else {
      server.listen(PORT, () => {
        console.log(createBox("🏭 PRODUCTION Server", PORT, environment));
      });
    }
  })();
}

module.exports = app;
