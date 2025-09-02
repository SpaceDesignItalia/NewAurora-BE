const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const https = require("https");
const http = require("http");
require("dotenv").config();

// Importa le route

const credentials = {
  key: fs.readFileSync("SSL/privateKey.key"),
  cert: fs.readFileSync("SSL/SpaceDesignAurora.pem"),
};

const app = express();
app.use(express.static("public"));
const PREFIX = "/API/v1";
const PORT = 3000; // Porta standard per HTTPS

const db = require("./configs/Database");

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

// Crea il server HTTPS
let server;
if (process.env.ENVIRONMENT === "development") {
  server = http.createServer(app);
} else {
  server = https.createServer(credentials, app);
}

// Definisci le route principali

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
      .padStart((padding + "Powered By 🚀 Space Design Italia".length) / 2, " ")
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

module.exports = server;
