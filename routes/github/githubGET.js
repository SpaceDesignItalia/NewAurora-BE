// routes/github/githubGET.js
const express = require("express");
const router = express.Router();
const GitHubController = require("../../controllers/GitHubController");

const githubGET = () => {
  /**
   * GET /api/github/GET/list-repos (legacy)
   * Lista tutti i repository accessibili con il token fornito
   * Authorization: Bearer <githubToken>
   */
  router.get("/list-repos", GitHubController.listReposLegacy);

  return router;
};

module.exports = githubGET;
