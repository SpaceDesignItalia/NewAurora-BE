// routes/github/GitHub.js
const express = require("express");
const router = express.Router();
const githubGET = require("./githubGET");
const githubPOST = require("./githubPOST");
const githubAuth = require("./githubAuth");
const githubREST = require("./githubREST");
const GitHubController = require("../../controllers/GitHubController");

const GitHub = () => {
  // Route legacy (mantenute per compatibilità)
  router.use("/GET", githubGET());
  router.use("/POST", githubPOST());

  // Route RESTful nuove
  router.use("/", githubREST());

  // Route autenticazione OAuth
  router.use("/auth", githubAuth());

  // Route logout per compatibilità (supporta sia /github/logout che /github/auth/logout)
  router.post("/logout", GitHubController.logout);

  return router;
};

module.exports = GitHub;

