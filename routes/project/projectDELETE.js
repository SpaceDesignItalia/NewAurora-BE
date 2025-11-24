// projectDELETE.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectDELETE = () => {
  // Definisci le route DELETE qui

  router.delete("/delete-project", authenticateMiddleware, (req, res) => {
    ProjectController.delete_project(req, res);
  });

  router.delete("/delete-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.delete_sprint(req, res);
  });

  router.delete("/delete-task", authenticateMiddleware, (req, res) => {
    ProjectController.delete_task(req, res);
  });

  router.delete(
    "/delete-feature-flag-group",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.delete_feature_flag_group(req, res);
    }
  );

  router.delete("/delete-feature-flag", authenticateMiddleware, (req, res) => {
    ProjectController.delete_feature_flag(req, res);
  });

  router.delete(
    "/delete-feature-flag-target",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.delete_feature_flag_target(req, res);
    }
  );
  router.delete(
    "/delete-feature-flag-rule",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.delete_feature_flag_rule(req, res);
    }
  );

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectDELETE;
