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

      // Fornisci messaggi di errore più specifici
      if (
        error.message.includes("non valido") ||
        error.message.includes("non trovato")
      ) {
        res.status(400).json({
          error: error.message,
        });
      } else {
        res.status(500).json({
          error: "Creazione del progetto fallita",
          details: error.message,
        });
      }
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

  static async get_all_feature_flags(req, res) {
    try {
      const project_id = req.query.project_id;

      let feature_flags = await Project.get_all_feature_flags(project_id);

      if (feature_flags.length > 0) {
        res.status(200).json({
          message: "Feature flags trovati con successo",
          feature_flags: feature_flags,
        });
      } else {
        res.status(404).json({
          message: "Nessuna feature flag trovata",
        });
      }
    } catch (error) {
      console.error("Errore nella ricerca delle feature flags:", error);
      res.status(500).send("Ricerca delle feature flags fallita");
    }
  }

  static async get_all_feature_flag_groups(req, res) {
    try {
      const project_id = req.query.project_id;
      let feature_flag_groups = await Project.get_all_feature_flag_groups(
        project_id
      );
      res.status(200).json({
        message: "Feature flag groups trovati con successo",
        feature_flag_groups: feature_flag_groups,
      });
    } catch (error) {
      console.error("Errore nella ricerca delle feature flag groups:", error);
      res.status(500).send("Ricerca delle feature flag groups fallita");
    }
  }

  static async get_feature_flag(req, res) {
    try {
      const project_unique_id = req.query.projectUniqueId;
      const feature_flag_key = req.query.featureFlagKey;
      let feature_flag = await Project.get_feature_flag(
        project_unique_id,
        feature_flag_key
      );
      res.status(200).json({
        message: "Feature flag trovata con successo",
        feature_flag: feature_flag,
      });
    } catch (error) {
      console.error("Errore nella ricerca delle feature flags:", error);
      res.status(500).send("Ricerca delle feature flags fallita");
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

  static async create_sprint(req, res) {
    try {
      const sprint_data = req.body.sprint_data;
      const user_id = req.session.account.user_id;
      await Project.create_sprint(sprint_data, user_id);
      res.status(200).json({
        message: "Sprint creato con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione del sprint:", error);
      res.status(500).send("Creazione del sprint fallita");
    }
  }

  static async create_feature_flag(req, res) {
    try {
      const feature_flag_data = req.body.feature_flag_data;
      const user_id = req.session.account.user_id;
      await Project.create_feature_flag(feature_flag_data, user_id);

      res.status(200).json({
        message: "Feature flag creata con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione della feature flag:", error);

      // Fornisci messaggi di errore più specifici
      if (error.message.includes("Esiste già una feature flag")) {
        res.status(409).json({
          error: error.message,
        });
      } else if (
        error.message.includes("non valido") ||
        error.message.includes("non trovato")
      ) {
        res.status(400).json({
          error: error.message,
        });
      } else {
        res.status(500).json({
          error: "Creazione della feature flag fallita",
          details: error.message,
        });
      }
    }
  }

  static async create_feature_flag_group(req, res) {
    try {
      const feature_flag_group_data = req.body.feature_flag_group_data;
      const user_id = req.session.account.user_id;
      await Project.create_feature_flag_group(feature_flag_group_data, user_id);
      res.status(200).json({
        message: "Feature flag group creato con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione della feature flag group:", error);
      res.status(500).send("Creazione della feature flag group fallita");
    }
  }

  static async change_feature_flag_state(req, res) {
    try {
      const feature_flag_id = req.body.feature_flag_id;
      const value = req.body.value;
      await Project.change_feature_flag_state(feature_flag_id, value);
      res.status(200).json({
        message: "Feature flag abilitata con successo",
      });
    } catch (error) {
      console.error("Errore nell'abilitazione della feature flag:", error);
      res.status(500).send("Abilitazione della feature flag fallita");
    }
  }

  static async move_task(req, res) {
    try {
      const task_id = req.body.task_id;
      const target_sprint_id = req.body.target_sprint_id;
      await Project.move_task(task_id, target_sprint_id);
      res.status(200).json({
        message: "Task spostato con successo",
      });
    } catch (error) {
      console.error("Errore nello spostamento del task:", error);
      res.status(500).send("Spostamento del task fallito");
    }
  }

  static async start_sprint(req, res) {
    try {
      const sprint_id = req.body.sprint_id;
      const project_id = req.body.project_id;
      await Project.start_sprint(sprint_id, project_id);
      res.status(200).json({
        message: "Sprint avviato con successo",
      });
    } catch (error) {
      console.error("Errore nell'avvio del sprint:", error);
      res.status(500).send("Avvio del sprint fallito");
    }
  }

  static async complete_sprint(req, res) {
    try {
      const sprint_id = req.body.sprint_id;
      await Project.complete_sprint(sprint_id);
      res.status(200).json({
        message: "Sprint completato con successo",
      });
    } catch (error) {
      console.error("Errore nella completa del sprint:", error);
      res.status(500).send("Completa del sprint fallita");
    }
  }

  static async update_feature_flag(req, res) {
    try {
      const feature_flag_data = req.body.feature_flag_data;
      const user_id = req.session.account.user_id;
      console.log("Aggiornamento feature flag");
      console.log(feature_flag_data);
      await Project.update_feature_flag(feature_flag_data, user_id);
      res.status(200).json({
        message: "Feature flag aggiornata con successo",
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento della feature flag:", error);
      res.status(500).send("Aggiornamento della feature flag fallita");
    }
  }

  static async update_targeting_rule(req, res) {
    try {
      const target_id = req.body.target_id;
      const value = req.body.value;
      await Project.update_targeting_rule(target_id, value);
      res.status(200).json({
        message: "Targeting rule aggiornata con successo",
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento della targeting rule:", error);
      res.status(500).send("Aggiornamento della targeting rule fallita");
    }
  }

  static async update_feature_flag_group(req, res) {
    try {
      const feature_flag_group_data = req.body.feature_flag_group_data;
      await Project.update_feature_flag_group(feature_flag_group_data);
      res.status(200).json({
        message: "Feature flag group aggiornata con successo",
      });
    } catch (error) {
      console.error(
        "Errore nell'aggiornamento della feature flag group:",
        error
      );
      res.status(500).send("Aggiornamento della feature flag group fallita");
    }
  }

  static async update_feature_flag_group_state(req, res) {
    try {
      const feature_flag_id = req.body.feature_flag_id;
      const feature_flag_group_id = req.body.feature_flag_group_id;
      await Project.update_feature_flag_group_state(
        feature_flag_id,
        feature_flag_group_id
      );
      res.status(200).json({
        message: "Feature flag group stato cambiato con successo",
      });
    } catch (error) {
      console.error(
        "Errore nell'aggiornamento del stato della feature flag group:",
        error
      );
      res
        .status(500)
        .send("Aggiornamento del stato della feature flag group fallita");
    }
  }

  static async delete_sprint(req, res) {
    try {
      const sprint_id = req.query.sprint_id;
      await Project.delete_sprint(sprint_id);
      res.status(200).json({
        message: "Sprint eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del sprint:", error);
      res.status(500).send("Eliminazione del sprint fallita");
    }
  }

  static async delete_task(req, res) {
    try {
      const task_id = req.query.task_id;
      await Project.delete_task(task_id);
      res.status(200).json({
        message: "Task eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione del task:", error);
      res.status(500).send("Eliminazione del task fallita");
    }
  }

  static async delete_feature_flag_group(req, res) {
    try {
      const feature_flag_group_id = req.body.feature_flag_group_id;
      await Project.delete_feature_flag_group(feature_flag_group_id);
      res.status(200).json({
        message: "Feature flag group eliminata con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione della feature flag:", error);
      res.status(500).send("Eliminazione della feature flag fallita");
    }
  }

  static async delete_feature_flag(req, res) {
    try {
      const feature_flag_id = req.body.feature_flag_id;
      await Project.delete_feature_flag(feature_flag_id);
      res.status(200).json({
        message: "Feature flag eliminata con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione della feature flag:", error);
      res.status(500).send("Eliminazione della feature flag fallita");
    }
  }

  static async delete_feature_flag_target(req, res) {
    try {
      const feature_flag_target_id = req.body.feature_flag_target_id;
      await Project.delete_feature_flag_target(feature_flag_target_id);
      res.status(200).json({
        message: "Feature flag target eliminato con successo",
      });
    } catch (error) {
      console.error(
        "Errore nell'eliminazione della feature flag target:",
        error
      );
      res.status(500).send("Eliminazione della feature flag target fallita");
    }
  }

  static async delete_feature_flag_rule(req, res) {
    try {
      const feature_flag_rule_id = req.body.feature_flag_rule_id;
      await Project.delete_feature_flag_rule(feature_flag_rule_id);
      res.status(200).json({
        message: "Feature flag rule eliminato con successo",
      });
    } catch (error) {
      console.error("Errore nell'eliminazione della feature flag rule:", error);
      res.status(500).send("Eliminazione della feature flag rule fallita");
    }
  }
}

module.exports = ProjectController;
