// projectGET.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectGET = () => {
  // Definisci le route GET qui

  router.get("/get-projects", authenticateMiddleware, (req, res) => {
    ProjectController.get_projects(req, res);
  });

  router.get("/get-project-by-id", authenticateMiddleware, (req, res) => {
    ProjectController.get_project_by_id(req, res);
  });

  router.get("/get-project-statuses", authenticateMiddleware, (req, res) => {
    ProjectController.get_project_statuses(req, res);
  });

  router.get(
    "/get-project-by-unique-id",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.get_project_by_unique_id(req, res);
    }
  );

  router.get("/get-task-statuses", authenticateMiddleware, (req, res) => {
    ProjectController.get_task_statuses(req, res);
  });

  router.get("/get-task-priorities", authenticateMiddleware, (req, res) => {
    ProjectController.get_task_priorities(req, res);
  });

  router.get(
    "/get-sprints-by-project-id",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.get_sprints_by_project_id(req, res);
    }
  );

  router.get(
    "/get-backlog-by-project-id",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.get_backlog_by_project_id(req, res);
    }
  );

  router.get("/get-tasks-by-project-id", authenticateMiddleware, (req, res) => {
    ProjectController.get_tasks_by_project_id(req, res);
  });

  router.get("/get-all-tasks", authenticateMiddleware, (req, res) => {
    ProjectController.get_all_tasks(req, res);
  });

  router.get("/get-all-feature-flags", authenticateMiddleware, (req, res) => {
    ProjectController.get_all_feature_flags(req, res);
  });

  router.get(
    "/get-all-feature-flag-groups",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.get_all_feature_flag_groups(req, res);
    }
  );

  router.get("/get-feature-flag", (req, res) => {
    ProjectController.get_feature_flag(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectGET;
