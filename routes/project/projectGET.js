// projectGET.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../Controllers/ProjectController");
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

  router.get("/get-sprint-by-id", authenticateMiddleware, (req, res) => {
    ProjectController.get_sprint_by_id(req, res);
  });

  router.get("/:project_id/vault", authenticateMiddleware, (req, res) => {
    ProjectController.get_vault_entries_by_project_id(req, res);
  });

  router.get(
    "/:project_id/vault/:vault_id/history",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.get_vault_history(req, res);
    }
  );

  // Route per export del vault
  router.get(
    "/:project_id/vault/export",
    authenticateMiddleware,
    (req, res) => {
      ProjectController.export_vault(req, res);
    }
  );

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectGET;
