// controller/ProjectController.js
const Project = require("../Models/ProjectModel");

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
      let projects = await Project.get_projects();

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
}

module.exports = ProjectController;
