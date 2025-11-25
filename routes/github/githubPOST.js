// routes/github/githubPOST.js
const express = require("express");
const router = express.Router();
const GitHubController = require("../../controllers/GitHubController");

const githubPOST = () => {
  /**
   * POST /api/github/POST/push-secret (legacy)
   * Pubblica un secret su GitHub Actions
   * Body: { githubToken, repoFullName, secretName, secretValue }
   */
  router.post("/push-secret", GitHubController.pushSecretLegacy);

  return router;
};

module.exports = githubPOST;
