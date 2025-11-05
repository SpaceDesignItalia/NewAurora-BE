// controller/ProjectController.js
const Project = require("../models/ProjectModel");

class ProjectController {
  static async create_project(req, res) {
    try {
      const create_project_data = req.body.project_data;
      const user_id = req.session.account.user_id;
      await Project.create_project(create_project_data, user_id);

      res.status(200).json({
        message: "Progetto creato con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione del progetto:", error);
      res.status(500).send("Creazione del progetto fallita");
    }
  }

  static async get_projects(req, res) {
    try {
      // Extract only search parameter from query string
      const search = req.query.search || null;

      let projects = await Project.get_projects(search);

      res.status(200).json({
        message: "Progetti trovati con successo",
        projects: projects,
      });
    } catch (error) {
      console.error("Errore nella ricerca dei progetti:", error);
      res.status(500).send("Ricerca dei progetti fallita");
    }
  }

  static async get_project_by_id(req, res) {
    try {
      const project_id = req.body.project_id;
      let project = await Project.get_project_by_id(project_id);

      res.status(200).json({
        message: "Progetto trovato con successo",
        project: project,
      });
    } catch (error) {
      console.error("Errore nella ricerca del progetto:", error);
      res.status(500).send("Ricerca del progetto fallita");
    }
  }

  static async get_project_statuses(req, res) {
    try {
      let project_statuses = await Project.get_project_statuses();

      res.status(200).json({
        message: "Status progetti trovati con successo",
        project_statuses: project_statuses,
      });
    } catch (error) {
      console.error("Errore nella ricerca degli status progetti:", error);
      res.status(500).send("Ricerca degli status progetti fallita");
    }
  }

  static async delete_project(req, res) {
    try {
      const project_id = req.body.project_id;
      await Project.delete_project(project_id);

      res.status(200).json({
        message: "Progetto eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del progetto:", error);
      res.status(500).send("Eliminazione del progetto fallita");
    }
  }

  static async get_project_by_unique_id(req, res) {
    try {
      const unique_id = req.query.unique_id;
      let project = await Project.get_project_by_unique_id(unique_id);

      res.status(200).json({
        message: "Progetto trovato con successo",
        project: project,
      });
    } catch (error) {
      console.error("Errore nella ricerca del progetto:", error);
      res.status(500).send("Ricerca del progetto fallita");
    }
  }

  static async get_task_statuses(req, res) {
    try {
      const project_id = req.query.project_id;
      let task_statuses = await Project.get_task_statuses(project_id);
      res.status(200).json({
        message: "Status task trovati con successo",
        task_statuses: task_statuses,
      });
    } catch (error) {
      console.error("Errore nella ricerca degli status task:", error);
      res.status(500).send("Ricerca degli status task fallita");
    }
  }

  static async get_task_priorities(req, res) {
    try {
      let task_priorities = await Project.get_task_priorities();
      res.status(200).json({
        message: "Priorità task trovati con successo",
        task_priorities: task_priorities,
      });
    } catch (error) {}
  }

  static async get_sprints_by_project_id(req, res) {
    try {
      const project_id = req.query.project_id;
      let sprints = await Project.get_sprints_by_project_id(project_id);
      res.status(200).json({
        message: "Sprints trovati con successo",
        sprints: sprints,
      });
    } catch (error) {
      console.error("Errore nella ricerca degli sprints:", error);
      res.status(500).send("Ricerca degli sprints fallita");
    }
  }

  static async get_backlog_by_project_id(req, res) {
    try {
      const project_id = req.query.project_id;
      let backlog = await Project.get_backlog_by_project_id(project_id);
      res.status(200).json({
        message: "Backlog trovato con successo",
        backlog: backlog,
      });
    } catch (error) {
      console.error("Errore nella ricerca del backlog:", error);
      res.status(500).send("Ricerca del backlog fallita");
    }
  }

  static async get_tasks_by_project_id(req, res) {
    try {
      const project_id = req.query.project_id;
      let tasks = await Project.get_tasks_by_project_id(project_id);
      res.status(200).json({
        message: "Task trovati con successo",
        tasks: tasks,
      });
    } catch (error) {
      console.error("Errore nella ricerca dei task:", error);
      res.status(500).send("Ricerca dei task fallita");
    }
  }

  static async get_all_tasks(req, res) {
    try {
      let tasks = await Project.get_all_tasks();
      res.status(200).json({
        message: "Task trovati con successo",
        tasks: tasks,
      });
    } catch (error) {
      console.error("Errore nella ricerca dei task:", error);
      res.status(500).send("Ricerca dei task fallita");
    }
  }

  static async create_task(req, res) {
    try {
      const task_data = req.body.task_data;
      const user_id = req.session.account.user_id;
      await Project.create_task(task_data, user_id);
      res.status(200).json({
        message: "Task creato con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione del task:", error);
      res.status(500).send("Creazione del task fallita");
    }
  }
}

module.exports = ProjectController;
