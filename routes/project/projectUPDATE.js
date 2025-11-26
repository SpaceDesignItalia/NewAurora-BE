// projectUPDATE.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectUPDATE = () => {
  // Definisci le route UPDATE qui

  router.put("/move-task", authenticateMiddleware, (req, res) => {
    ProjectController.move_task(req, res);
  });

  router.put("/start-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.start_sprint(req, res);
  });

  router.put("/complete-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.complete_sprint(req, res);
  });

  router.put("/update-feature-flag", authenticateMiddleware, (req, res) => {
    ProjectController.update_feature_flag(req, res);
  });

  router.put("/update-targeting-rule", authenticateMiddleware, (req, res) => {
    ProjectController.update_targeting_rule(req, res);
  });

  router.put(
    "/update-feature-flag-group",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.update_feature_flag_group(req, res);
    }
  );

  router.put(
    "/update-feature-flag-group-state",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.update_feature_flag_group_state(req, res);
    }
  );
  router.put("/update-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.update_sprint(req, res);
  });

  router.put("/update-task-status", authenticateMiddleware, (req, res) => {
    ProjectController.update_task_status(req, res);
  });

  router.put(
    "/:project_id/vault/:vault_id",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.update_vault_entry(req, res);
    }
  );

  router.put("/update-project", authenticateMiddleware, (req, res) => {
    ProjectController.update_project(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectUPDATE;
