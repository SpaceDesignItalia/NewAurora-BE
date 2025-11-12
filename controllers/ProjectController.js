// controller/ProjectController.js
const Project = require("../models/ProjectModel");
const VaultExportService = require("../services/VaultExportService");

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

  static async create_task_status(req, res) {
    try {
      const task_status_data = req.body.task_status_data;
      const user_id = req.session.account.user_id;
      await Project.create_task_status(task_status_data, user_id);
      res.status(200).json({
        message: "Colonna creata con successo",
      });
    } catch (error) {
      console.error("Errore nella creazione della colonna:", error);
      res.status(500).send("Creazione della colonna fallita");
    }
  }

  static async get_sprint_by_id(req, res) {
    try {
      const sprint_id = req.query.sprint_id;
      let sprint = await Project.get_sprint_by_id(sprint_id);
      res.status(200).json({
        message: "Sprint trovato con successo",
        sprint: sprint,
      });
    } catch (error) {
      console.error("Errore nella ricerca del sprint:", error);
      res.status(500).send("Ricerca del sprint fallita");
    }
  }

  static async update_sprint(req, res) {
    try {
      const sprint_id = req.body.sprint_id;
      const sprint_data = req.body.sprint_data;
      await Project.update_sprint(sprint_id, sprint_data);
      res.status(200).json({
        message: "Sprint modificato con successo",
      });
    } catch (error) {
      console.error("Errore nella modifica del sprint:", error);
      res.status(500).send("Modifica del sprint fallita");
    }
  }

  static async update_task_status(req, res) {
    try {
      const task_id = req.body.task_id;
      const task_status_id = req.body.task_status_id;
      await Project.update_task_status(task_id, task_status_id);
      res.status(200).json({
        message: "Task aggiornato con successo",
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento del task:", error);
      res.status(500).send("Aggiornamento del task fallito");
    }
  }

  // ========== METODI VAULT ==========

  // Ottiene tutte le entry del vault per un progetto
  static async get_vault_entries_by_project_id(req, res) {
    try {
      const { project_id } = req.params;

      if (!project_id) {
        return res.status(400).json({
          error: "Project ID richiesto",
          message: "L'ID del progetto è obbligatorio",
        });
      }

      const vault_entries = await Project.get_vault_entries_by_project_id(
        project_id
      );

      res.status(200).json({
        vault_entries: vault_entries,
      });
    } catch (error) {
      console.error("Errore nel recupero delle entry del vault:", error);
      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile recuperare le entry del vault",
      });
    }
  }

  // Crea una nuova entry del vault
  static async create_vault_entry(req, res) {
    try {
      const { project_id } = req.params;
      const { key, value, is_sensitive } = req.body;

      if (!project_id) {
        return res.status(400).json({
          error: "Project ID richiesto",
          message: "L'ID del progetto è obbligatorio",
        });
      }

      if (!key || !key.trim()) {
        return res.status(400).json({
          error: "Chiave richiesta",
          message: "La chiave è obbligatoria",
        });
      }

      const vault_entry = await Project.create_vault_entry(
        project_id,
        key.trim(),
        value || "",
        is_sensitive || false
      );

      res.status(201).json({
        message: "Entry del vault creata con successo",
        vault_entry: vault_entry,
      });
    } catch (error) {
      console.error("Errore nella creazione dell'entry del vault:", error);

      if (error.message?.includes("esiste già")) {
        return res.status(400).json({
          error: "Chiave duplicata",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile creare l'entry del vault",
      });
    }
  }

  // Aggiorna una entry del vault
  static async update_vault_entry(req, res) {
    try {
      const { project_id, vault_id } = req.params;
      const { key, value, is_sensitive } = req.body;

      if (!project_id || !vault_id) {
        return res.status(400).json({
          error: "ID richiesti",
          message: "L'ID del progetto e dell'entry sono obbligatori",
        });
      }

      if (!key || !key.trim()) {
        return res.status(400).json({
          error: "Chiave richiesta",
          message: "La chiave è obbligatoria",
        });
      }

      const vault_entry = await Project.update_vault_entry(
        vault_id,
        key.trim(),
        value || "",
        is_sensitive
      );

      res.status(200).json({
        message: "Entry del vault aggiornata con successo",
        vault_entry: vault_entry,
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'entry del vault:", error);

      if (error.message?.includes("non trovata")) {
        return res.status(404).json({
          error: "Entry non trovata",
          message: error.message,
        });
      }

      if (error.message?.includes("esiste già")) {
        return res.status(400).json({
          error: "Chiave duplicata",
          message: error.message,
        });
      }

      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile aggiornare l'entry del vault",
      });
    }
  }

  // Elimina una entry del vault
  static async delete_vault_entry(req, res) {
    try {
      const { project_id, vault_id } = req.params;

      if (!project_id || !vault_id) {
        return res.status(400).json({
          error: "ID richiesti",
          message: "L'ID del progetto e dell'entry sono obbligatori",
        });
      }

      const vault_entry = await Project.delete_vault_entry(vault_id);

      res.status(200).json({
        message: "Entry del vault eliminata con successo",
        vault_entry: vault_entry,
      });
    } catch (error) {
      console.error("Errore nell'eliminazione dell'entry del vault:", error);

      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Entry non trovata",
          message: "L'entry del vault non esiste",
        });
      }

      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile eliminare l'entry del vault",
      });
    }
  }

  // Ottiene la cronologia di una entry del vault
  static async get_vault_history(req, res) {
    try {
      const { project_id, vault_id } = req.params;

      if (!project_id || !vault_id) {
        return res.status(400).json({
          error: "ID richiesti",
          message: "L'ID del progetto e dell'entry sono obbligatori",
        });
      }

      const history = await Project.get_vault_history(vault_id);

      res.status(200).json({
        history: history,
      });
    } catch (error) {
      console.error("Errore nel recupero della cronologia:", error);
      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile recuperare la cronologia",
      });
    }
  }

  // Esporta le entry del vault in diversi formati
  static async export_vault(req, res) {
    try {
      const { project_id } = req.params;
      const { format, filter_sensitive, secret_name, namespace } = req.query;

      if (!project_id) {
        return res.status(400).json({
          error: "Project ID richiesto",
          message: "L'ID del progetto è obbligatorio",
        });
      }

      // Valida il formato
      const valid_formats = ["docker", "k8s", "kubernetes", "cicd", "ci", "json"];
      if (!format || !valid_formats.includes(format.toLowerCase())) {
        return res.status(400).json({
          error: "Formato non valido",
          message: `Formato deve essere uno di: ${valid_formats.join(", ")}`,
        });
      }

      // Ottieni le entry del vault (con valori decifrati)
      const filter_sensitive_bool = filter_sensitive === "true";
      const vault_entries = await Project.get_vault_entries_for_export(
        project_id,
        filter_sensitive_bool
      );

      let export_content = "";
      let content_type = "text/plain";
      let filename = `vault-export-${project_id}`;

      // Genera il contenuto in base al formato
      switch (format.toLowerCase()) {
        case "docker":
          export_content = VaultExportService.exportDocker(
            vault_entries,
            filter_sensitive_bool
          );
          content_type = "text/plain";
          filename += ".env";
          break;

        case "k8s":
        case "kubernetes":
          export_content = VaultExportService.exportKubernetes(
            vault_entries,
            secret_name || "vault-secret",
            namespace || "default",
            filter_sensitive_bool
          );
          content_type = "application/yaml";
          filename += ".yaml";
          break;

        case "cicd":
        case "ci":
          export_content = VaultExportService.exportCICD(
            vault_entries,
            filter_sensitive_bool
          );
          content_type = "application/yaml";
          filename += ".yaml";
          break;

        case "json":
          export_content = VaultExportService.exportJSON(
            vault_entries,
            filter_sensitive_bool
          );
          content_type = "application/json";
          filename += ".json";
          break;

        default:
          return res.status(400).json({
            error: "Formato non supportato",
            message: "Formato non valido",
          });
      }

      // Imposta gli header per il download
      res.setHeader("Content-Type", content_type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.status(200).send(export_content);
    } catch (error) {
      console.error("Errore nell'export del vault:", error);
      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile esportare il vault",
      });
    }
  }

  static async update_project(req, res) {
    try {
      const project_data = req.body.project_data;
      await Project.update_project(project_data);
      res.status(200).json({
        message: "Progetto aggiornato con successo",
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento del progetto:", error);
      res.status(500).send("Aggiornamento del progetto fallito");
    }
  }
}

module.exports = ProjectController;
