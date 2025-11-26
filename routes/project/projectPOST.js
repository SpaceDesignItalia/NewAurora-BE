// projectPOST.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectPOST = () => {
  // Definisci le route POST qui

  router.post("/create-project", authenticateMiddleware, (req, res) => {
    ProjectController.create_project(req, res);
  });

  router.post("/create-task", authenticateMiddleware, (req, res) => {
    ProjectController.create_task(req, res);
  });

  router.post("/create-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.create_sprint(req, res);
  });

  router.post("/create-feature-flag", authenticateMiddleware, (req, res) => {
    ProjectController.create_feature_flag(req, res);
  });

  router.post(
    "/create-feature-flag-group",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.create_feature_flag_group(req, res);
    }
  );

  router.post(
    "/change-feature-flag-state",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.change_feature_flag_state(req, res);
    }
  );

  router.post("/create-task-status", authenticateMiddleware, (req, res) => {
    ProjectController.create_task_status(req, res);
  });

  router.post("/:project_id/vault", authenticateMiddleware, (req, res) => {
    ProjectController.create_vault_entry(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectPOST;
