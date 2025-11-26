const { PrismaClient } = require("@prisma/client");
const VaultEncryptionService = require("../services/VaultEncryptionService");

const prisma = new PrismaClient();

class ProjectModel {
  static async create_project(project_data, user_id) {
    try {
      // Converti e valida project_status_id
      const project_status_id = parseInt(project_data.projectStatus);
      if (isNaN(project_status_id)) {
        throw new Error("project_status_id non valido");
      }

      // Converti e valida created_by_id
      const created_by_id = parseInt(user_id);
      if (isNaN(created_by_id)) {
        throw new Error("created_by_id non valido");
      }

      const project = await prisma.$transaction(async (tx) => {
        // Verifica che il project_status esista
        const projectStatus = await tx.project_Status.findUnique({
          where: { project_status_id: BigInt(project_status_id) },
        });
        if (!projectStatus) {
          throw new Error(
            `Project status con ID ${project_status_id} non trovato`
          );
        }

        // Verifica che l'utente esista
        const user = await tx.user.findUnique({
          where: { user_id: BigInt(created_by_id) },
        });
        if (!user) {
          throw new Error(`Utente con ID ${created_by_id} non trovato`);
        }

        // Crea il progetto
        const project_data_to_create = {
          name: project_data.name,
          description: project_data.description,
          start_date: project_data.startDate
            ? new Date(project_data.startDate)
            : null,
          end_date: project_data.endDate
            ? new Date(project_data.endDate)
            : null,
          project_status_id: BigInt(project_status_id),
          created_by_id: BigInt(created_by_id),
        };

        const newProject = await tx.project.create({
          data: project_data_to_create,
        });
        return newProject;
      });

      return project;
    } catch (error) {
      throw error;
    }
  }

  static async get_projects(search = null) {
    try {
      // Build the where clause based on search term only
      const whereClause = {};

      // Search by name or description
      if (search) {
        whereClause.OR = [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }

      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          project_status: true,
          created_by: true,
          project_members: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return projects;
    } catch (error) {
      throw error;
    }
  }

  static async get_project_by_id(project_id) {
    try {
      const project = await prisma.project.findUnique({
        where: {
          project_id: project_id,
        },
        include: {
          project_status: true,
          created_by: true,
          project_members: true,
        },
      });

      return project;
    } catch (error) {
      throw error;
    }
  }

  static async get_project_statuses() {
    try {
      const project_statuses = await prisma.project_Status.findMany();
      return project_statuses;
    } catch (error) {
      throw error;
    }
  }

  static async delete_project(project_id) {
    try {
      await prisma.project.delete({
        where: { project_id: project_id },
      });
    } catch (error) {
      throw error;
    }
  }

  static async get_project_by_unique_id(unique_id) {
    try {
      const project = await prisma.project.findUnique({
        where: { unique_id: unique_id },
        include: {
          project_status: true,
          created_by: true,
          project_members: true,
          tasks: {
            include: {
              task_priority: true,
              task_status: true,
            },
          },
          sprints: {
            include: {
              tasks: {
                include: {
                  task_status: true,
                },
              },
            },
          },
        },
      });
      return project;
    } catch (error) {
      throw error;
    }
  }

  static async get_task_statuses(project_id) {
    try {
      const task_statuses = await prisma.task_Status.findMany({
        where: { project_id: project_id },
      });
      return task_statuses;
    } catch (error) {
      throw error;
    }
  }

  static async get_task_priorities() {
    try {
      const task_priorities = await prisma.task_Priority.findMany();
      return task_priorities;
    } catch (error) {
      throw error;
    }
  }

  static async get_sprints_by_project_id(project_id) {
    try {
      const sprints = await prisma.sprint.findMany({
        where: { project_id: project_id },
        include: {
          tasks: {
            include: {
              task_status: true,
              task_priority: true,
              created_by: true,
            },
          },
          project: true,
          created_by: true,
        },
      });
      return sprints;
    } catch (error) {
      throw error;
    }
  }

  static async get_backlog_by_project_id(project_id) {
    try {
      const backlog = await prisma.task.findMany({
        where: { project_id: project_id, sprint_id: null },
        include: {
          task_status: true,
          task_priority: true,
          project: true,
          created_by: true,
          sprint: true,
        },
      });
      return backlog;
    } catch (error) {
      throw error;
    }
  }

  static async get_tasks_by_project_id(project_id) {
    try {
      const tasks = await prisma.task.findMany({
        where: { project_id: project_id },
        include: {
          task_status: true,
          task_priority: true,
          project: true,
          created_by: true,
          sprint: true,
        },
      });
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async get_all_tasks() {
    try {
      const tasks = await prisma.task.findMany({
        include: {
          task_status: true,
          task_priority: true,
          project: true,
          created_by: true,
          sprint: true,
        },
      });
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async get_all_feature_flags(project_id) {
    try {
      const project = await prisma.project.findUnique({
        where: { unique_id: project_id },
      });
      if (!project) {
        throw new Error("Progetto non trovato");
      }

      const feature_flags = await prisma.feature_Flag.findMany({
        where: { project_id: project.project_id },
        include: {
          targets: true,
        },
        orderBy: {
          feature_flag_id: "desc",
        },
      });
      return feature_flags;
    } catch (error) {
      throw error;
    }
  }

  static async get_all_feature_flag_groups(project_id) {
    try {
      const project = await prisma.project.findUnique({
        where: { unique_id: project_id },
      });
      if (!project) {
        throw new Error("Progetto non trovato");
      }

      const feature_flag_groups = await prisma.feature_Flag_Group.findMany({
        where: { project_id: project.project_id },
      });
      return feature_flag_groups;
    } catch (error) {
      throw error;
    }
  }

  static async get_feature_flag(project_unique_id, feature_flag_key) {
    try {
      console.log(project_unique_id, feature_flag_key);
      const project = await prisma.project.findUnique({
        where: { unique_id: project_unique_id },
      });
      if (!project) {
        throw new Error("Progetto non trovato");
      }

      const feature_flag = await prisma.feature_Flag.findFirst({
        where: { key: feature_flag_key, project_id: project.project_id },
        include: {
          targets: true,
          feature_flag_rules: true,
        },
      });

      if (!feature_flag) {
        throw new Error("Feature flag non trovata");
      }

      console.log(feature_flag);
      return feature_flag;
    } catch (error) {
      throw error;
    }
  }

  static async create_task(task_data, user_id) {
    try {
      const task_data_to_create = {
        title: task_data.title,
        description: task_data.description,
        task_status_id: parseInt(task_data.task_status_id),
        task_priority_id: task_data.task_priority_id,
        story_points: parseInt(task_data.story_points),
        sprint_id: parseInt(task_data.sprint_id),
        project_id: parseInt(task_data.project_id),
        created_by_id: parseInt(user_id),
      };

      const task = await prisma.$transaction(async (tx) => {
        // Crea il task
        const newTask = await tx.task.create({
          data: task_data_to_create,
        });
        return newTask;
      });

      return task;
    } catch (error) {
      throw error;
    }
  }

  static async create_sprint(sprint_data, user_id) {
    try {
      // Converti le date nel formato ISO-8601
      const startDate = new Date(sprint_data.start_date + "T00:00:00.000Z");
      const endDate = new Date(sprint_data.end_date + "T23:59:59.999Z");

      const sprint_data_to_create = {
        name: sprint_data.name,
        description: sprint_data.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        project_id: parseInt(sprint_data.project_id),
        created_by_id: parseInt(user_id),
      };

      const sprint = await prisma.$transaction(async (tx) => {
        // Crea il sprint
        const newSprint = await tx.sprint.create({
          data: sprint_data_to_create,
        });
        return newSprint;
      });
      return sprint;
    } catch (error) {
      throw error;
    }
  }

  static async create_feature_flag(feature_flag_data, user_id) {
    try {
      // Converti e valida created_by_id
      const created_by_id = parseInt(user_id);
      if (isNaN(created_by_id)) {
        throw new Error("created_by_id non valido");
      }

      const feature_flag = await prisma.$transaction(async (tx) => {
        // Verifica che l'utente esista
        const user = await tx.user.findUnique({
          where: { user_id: BigInt(created_by_id) },
        });
        if (!user) {
          throw new Error(`Utente con ID ${created_by_id} non trovato`);
        }

        // Verifica che il progetto esista
        const project = await tx.project.findUnique({
          where: { unique_id: feature_flag_data.project_id },
        });
        if (!project) {
          throw new Error(
            `Progetto con ID ${feature_flag_data.project_id} non trovato`
          );
        }

        if (feature_flag_data.feature_flag_group_id !== null) {
          const group = await tx.feature_Flag_Group.findUnique({
            where: {
              feature_flag_group_id: feature_flag_data.feature_flag_group_id,
            },
          });
          if (!group) {
            throw new Error(
              `Feature flag group con ID ${feature_flag_data.feature_flag_group_id} non trovata`
            );
          }
        }

        // Verifica che non esista già una feature flag con la stessa chiave o nome nello stesso progetto
        const existingFeatureFlag = await tx.feature_Flag.findFirst({
          where: {
            project_id: project.project_id,
            OR: [
              { key: feature_flag_data.key },
              { name: feature_flag_data.name },
            ],
          },
        });
        if (existingFeatureFlag) {
          const duplicateField =
            existingFeatureFlag.key === feature_flag_data.key
              ? `chiave "${feature_flag_data.key}"`
              : `nome "${feature_flag_data.name}"`;
          throw new Error(
            `Esiste già una feature flag con ${duplicateField} in questo progetto`
          );
        }

        // Crea la feature flag

        const feature_flag_data_to_create = {
          name: feature_flag_data.name,
          key: feature_flag_data.key,
          description: feature_flag_data.description || null,
          default_value: feature_flag_data.default_value ?? true,
          enabled: feature_flag_data.enabled ?? true,
          created_by_id: BigInt(created_by_id),
          project_id: project.project_id,
          feature_flag_group_id: feature_flag_data.feature_flag_group_id
            ? BigInt(feature_flag_data.feature_flag_group_id)
            : null,
        };

        const newFeatureFlag = await tx.feature_Flag.create({
          data: feature_flag_data_to_create,
        });

        if (feature_flag_data.targeting.length > 0) {
          for (const targeting of feature_flag_data.targeting) {
            const targeting_data_to_create = {
              name: targeting.name,
              type: targeting.type,
              operator: targeting.operator,
              value: targeting.value,
              enabled: targeting.enabled ?? true,
              feature_flag_id: newFeatureFlag.feature_flag_id,
              created_by_id: BigInt(created_by_id),
            };

            await tx.feature_Flag_Target.create({
              data: targeting_data_to_create,
            });
          }
        }

        if (feature_flag_data.rules.length > 0) {
          for (const rule of feature_flag_data.rules) {
            const rule_data_to_create = {
              field: rule.field,
              operator: rule.operator,
              value: rule.value,
              feature_flag_id: newFeatureFlag.feature_flag_id,
              created_by_id: BigInt(created_by_id),
            };

            await tx.feature_Flag_Rule.create({
              data: rule_data_to_create,
            });
          }
        }

        console.log(
          "Feature Flag (" + newFeatureFlag.key + ") creato con successo"
        );
        return newFeatureFlag;
      });

      return feature_flag;
    } catch (error) {
      throw error;
    }
  }

  static async create_feature_flag_group(feature_flag_group_data, user_id) {
    try {
      const created_by_id = parseInt(user_id);
      if (isNaN(created_by_id)) {
        throw new Error("created_by_id non valido");
      }

      const feature_flag_group = await prisma.$transaction(async (tx) => {
        // Verifica che l'utente esista
        const user = await tx.user.findUnique({
          where: { user_id: BigInt(created_by_id) },
        });
        if (!user) {
          throw new Error(`Utente con ID ${created_by_id} non trovato`);
        }

        // Verifica che il progetto esista
        const project = await tx.project.findUnique({
          where: { unique_id: feature_flag_group_data.project_id },
        });
        if (!project) {
          throw new Error(
            `Progetto con ID ${feature_flag_group_data.project_id} non trovato`
          );
        }

        const feature_flag_group_data_to_create = {
          name: feature_flag_group_data.name,
          description: feature_flag_group_data.description,
          project_id: project.project_id,
          created_by_id: BigInt(user.user_id),
        };

        const newFeatureFlagGroup = await tx.feature_Flag_Group.create({
          data: feature_flag_group_data_to_create,
        });

        return newFeatureFlagGroup;
      });
    } catch (error) {
      throw error;
    }
  }

  static async change_feature_flag_state(feature_flag_id, value) {
    try {
      await prisma.feature_Flag.update({
        where: { feature_flag_id: parseInt(feature_flag_id) },
        data: { enabled: value },
      });
    } catch (error) {
      throw error;
    }
  }

  static async move_task(task_id, target_sprint_id) {
    try {
      const task = await prisma.$transaction(async (tx) => {
        // Aggiorna il task
        const updatedTask = await tx.task.update({
          where: { task_id: parseInt(task_id) },
          data: {
            sprint_id: parseInt(target_sprint_id),
            updated_at: new Date(),
          },
        });
        return updatedTask;
      });
      return task;
    } catch (error) {
      throw error;
    }
  }

  static async start_sprint(sprint_id, project_id) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Trova lo sprint attivo esistente
        const old_active_sprint = await tx.sprint.findFirst({
          where: {
            project_id: parseInt(project_id),
            is_active: true,
          },
        });

        // Se esiste uno sprint attivo, disattivalo
        let updatedOldSprint = null;
        if (old_active_sprint) {
          updatedOldSprint = await tx.sprint.update({
            where: { sprint_id: old_active_sprint.sprint_id },
            data: { is_active: false, updated_at: new Date() },
          });
        }

        // Attiva il nuovo sprint
        const new_active_sprint = await tx.sprint.update({
          where: { sprint_id: parseInt(sprint_id) },
          data: { is_active: true, updated_at: new Date() },
        });

        return { old_active_sprint: updatedOldSprint, new_active_sprint };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async complete_sprint(sprint_id) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Completa il sprint
        const completedSprint = await tx.sprint.update({
          where: { sprint_id: parseInt(sprint_id) },
          data: {
            is_active: false,
            is_completed: true,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        });
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async update_feature_flag(feature_flag_data, user_id) {
    try {
      const created_by_id = parseInt(user_id);
      if (isNaN(created_by_id)) {
        throw new Error("created_by_id non valido");
      }

      console.log(feature_flag_data);

      const result = await prisma.$transaction(async (tx) => {
        // Verifica che la feature flag esista
        const feature_flag = await tx.feature_Flag.findUnique({
          where: {
            feature_flag_id: parseInt(feature_flag_data.feature_flag_id),
          },
        });
        if (!feature_flag) {
          throw new Error(
            `Feature flag con ID ${feature_flag_data.id} non trovata`
          );
        }

        // Verifica che il progetto esista
        const project = await tx.project.findUnique({
          where: { project_id: feature_flag.project_id },
        });
        if (!project) {
          throw new Error(
            `Progetto con ID ${feature_flag_data.project_id} non trovato`
          );
        }

        // Aggiorna la feature flag
        const updatedFeatureFlag = await tx.feature_Flag.update({
          where: { feature_flag_id: parseInt(feature_flag.feature_flag_id) },
          data: {
            name: feature_flag_data.name,
            key: feature_flag_data.key,
            description: feature_flag_data.description,
            default_value: feature_flag_data.default_value,
            enabled: feature_flag_data.enabled,
          },
        });

        if (
          feature_flag_data.targeting &&
          feature_flag_data.targeting.length > 0
        ) {
          for (const targeting of feature_flag_data.targeting) {
            const target_id = targeting.target_id || targeting.id;

            if (target_id) {
              // Aggiorna il targeting esistente
              await tx.feature_Flag_Target.update({
                where: { target_id: parseInt(target_id) },
                data: {
                  name: targeting.name,
                  type: targeting.type,
                  operator: targeting.operator,
                  value: targeting.value,
                  enabled: targeting.enabled,
                  updated_at: new Date(),
                },
              });
            } else {
              // Crea un nuovo targeting
              const targeting_data_to_create = {
                name: targeting.name,
                type: targeting.type,
                operator: targeting.operator,
                value: targeting.value,
                enabled: targeting.enabled,
                feature_flag_id: updatedFeatureFlag.feature_flag_id,
                created_by_id: BigInt(created_by_id),
              };

              await tx.feature_Flag_Target.create({
                data: targeting_data_to_create,
              });
            }
          }
        }

        if (feature_flag_data.rules && feature_flag_data.rules.length > 0) {
          for (const rule of feature_flag_data.rules) {
            const rule_id =
              rule.feature_flag_rule_id || rule.rule_id || rule.id;

            if (rule_id) {
              // Aggiorna la rule esistente
              await tx.feature_Flag_Rule.update({
                where: { feature_flag_rule_id: parseInt(rule_id) },
                data: {
                  field: rule.field,
                  operator: rule.operator,
                  value: rule.value,
                  updated_at: new Date(),
                },
              });
            } else {
              // Crea una nuova rule
              const rule_data_to_create = {
                field: rule.field,
                operator: rule.operator,
                value: rule.value,
                feature_flag_id: updatedFeatureFlag.feature_flag_id,
                created_by_id: BigInt(created_by_id),
              };

              await tx.feature_Flag_Rule.create({
                data: rule_data_to_create,
              });
            }
          }
        }

        return updatedFeatureFlag;
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async update_targeting_rule(target_id, value) {
    try {
      await prisma.feature_Flag_Target.update({
        where: {
          target_id: parseInt(target_id),
        },
        data: {
          enabled: value,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  static async update_feature_flag_group(feature_flag_group_data) {
    try {
      await prisma.feature_Flag_Group.update({
        where: {
          feature_flag_group_id: parseInt(
            feature_flag_group_data.feature_flag_group_id
          ),
        },
        data: {
          name: feature_flag_group_data.name,
          description: feature_flag_group_data.description,
          updated_at: new Date(),
        },
      });
      return {
        message: "Feature flag group aggiornata con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async update_feature_flag_group_state(
    feature_flag_id,
    feature_flag_group_id
  ) {
    try {
      await prisma.feature_Flag.update({
        where: { feature_flag_id: parseInt(feature_flag_id) },
        data: { feature_flag_group_id: parseInt(feature_flag_group_id) },
      });
    } catch (error) {
      throw error;
    }
  }

  static async delete_sprint(sprint_id) {
    try {
      await prisma.sprint.delete({
        where: { sprint_id: parseInt(sprint_id) },
      });
      return {
        message: "Sprint eliminato con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete_task(task_id) {
    try {
      await prisma.task.delete({
        where: { task_id: parseInt(task_id) },
      });
      return {
        message: "Task eliminato con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete_feature_flag_group(feature_flag_group_id) {
    try {
      const feature_flag_in_group = await prisma.feature_Flag.findMany({
        where: { feature_flag_group_id: parseInt(feature_flag_group_id) },
      });

      for (const feature_flag of feature_flag_in_group) {
        await prisma.feature_Flag.update({
          where: { feature_flag_id: feature_flag.feature_flag_id },
          data: {
            feature_flag_group_id: null,
          },
        });
      }

      await prisma.feature_Flag_Group.delete({
        where: { feature_flag_group_id: parseInt(feature_flag_group_id) },
      });
      return {
        message: "Feature flag group eliminata con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete_feature_flag(feature_flag_id) {
    try {
      await prisma.feature_Flag.delete({
        where: { feature_flag_id: parseInt(feature_flag_id) },
      });
      return {
        message: "Feature flag eliminata con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete_feature_flag_target(feature_flag_target_id) {
    try {
      await prisma.feature_Flag_Target.delete({
        where: { target_id: parseInt(feature_flag_target_id) },
      });
      return {
        message: "Feature flag target eliminato con successo",
      };
    } catch (error) {
      throw error;
    }
  }

  static async delete_feature_flag_rule(feature_flag_rule_id) {
    try {
      await prisma.feature_Flag_Rule.delete({
        where: { feature_flag_rule_id: parseInt(feature_flag_rule_id) },
      });
    } catch (error) {
      throw error;
    }
  }

  static async create_task_status(task_status_data, user_id) {
    try {
      const task_status_data_to_create = {
        name: task_status_data.name,
        color: task_status_data.color,
        project_id: parseInt(task_status_data.project_id),
        created_by_id: parseInt(user_id),
      };
      const task_status = await prisma.$transaction(async (tx) => {
        // Crea la colonna
        const newTaskStatus = await tx.task_Status.create({
          data: task_status_data_to_create,
        });
        return newTaskStatus;
      });
      return task_status;
    } catch (error) {
      throw error;
    }
  }

  static async get_sprint_by_id(sprint_id) {
    try {
      const sprint = await prisma.sprint.findUnique({
        where: { sprint_id: parseInt(sprint_id) },
      });
      return sprint;
    } catch (error) {
      throw error;
    }
  }

  static async update_sprint(sprint_id, sprint_data) {
    try {
      const startDate = new Date(sprint_data.start_date + "T00:00:00.000Z");
      const endDate = new Date(sprint_data.end_date + "T23:59:59.999Z");
      const sprint_data_to_update = {
        name: sprint_data.name,
        description: sprint_data.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date(),
      };
      const sprint = await prisma.$transaction(async (tx) => {
        // Aggiorna il sprint
        const updatedSprint = await tx.sprint.update({
          where: { sprint_id: parseInt(sprint_id) },
          data: sprint_data_to_update,
        });
        return updatedSprint;
      });
      return sprint;
    } catch (error) {
      throw error;
    }
  }

  static async update_task_status(task_id, task_status_id) {
    try {
      const task = await prisma.$transaction(async (tx) => {
        // Aggiorna il task
        const updatedTask = await tx.task.update({
          where: { task_id: parseInt(task_id) },
          data: { task_status_id: parseInt(task_status_id) },
        });
        return updatedTask;
      });
      return task;
    } catch (error) {
      throw error;
    }
  }

  // ========== METODI VAULT ==========

  // Ottiene tutte le entry del vault per un progetto
  static async get_vault_entries_by_project_id(project_id) {
    try {
      const vault_entries = await prisma.vault.findMany({
        where: {
          project_id: BigInt(project_id),
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Decifra i valori sensibili
      const decrypted_entries = vault_entries.map((entry) => {
        if (entry.is_sensitive && entry.value) {
          try {
            entry.value = VaultEncryptionService.decrypt(entry.value);
          } catch (error) {
            console.error(
              `Errore nella decifratura del vault_id ${entry.vault_id}:`,
              error
            );
            // Mantieni il valore cifrato in caso di errore
          }
        }
        return entry;
      });

      return decrypted_entries;
    } catch (error) {
      throw error;
    }
  }

  // Ottiene una entry del vault per ID
  static async get_vault_entry_by_id(vault_id) {
    try {
      const vault_entry = await prisma.vault.findUnique({
        where: {
          vault_id: BigInt(vault_id),
        },
      });

      if (!vault_entry) {
        return null;
      }

      // Decifra il valore se sensibile
      if (vault_entry.is_sensitive && vault_entry.value) {
        try {
          vault_entry.value = VaultEncryptionService.decrypt(vault_entry.value);
        } catch (error) {
          console.error(
            `Errore nella decifratura del vault_id ${vault_id}:`,
            error
          );
        }
      }

      return vault_entry;
    } catch (error) {
      throw error;
    }
  }

  // Crea una nuova entry del vault
  static async create_vault_entry(project_id, key, value, is_sensitive) {
    try {
      // Validazione key
      if (!key || !key.trim()) {
        throw new Error("La chiave è obbligatoria");
      }

      // Validazione key unica
      const existing = await prisma.vault.findUnique({
        where: {
          project_id_key: {
            project_id: BigInt(project_id),
            key: key.trim(),
          },
        },
      });

      if (existing) {
        throw new Error("Questa chiave esiste già per questo progetto");
      }

      // Cifra il valore se sensibile
      let encrypted_value = value;
      if (is_sensitive && value) {
        try {
          encrypted_value = VaultEncryptionService.encrypt(value);
        } catch (error) {
          console.error("Errore nella cifratura del valore:", error);
          throw new Error("Impossibile cifrare il valore sensibile");
        }
      }

      const vault_entry = await prisma.vault.create({
        data: {
          project_id: BigInt(project_id),
          key: key.trim(),
          value: encrypted_value,
          is_sensitive: is_sensitive || false,
        },
      });

      // Restituisci il valore decifrato per la risposta
      vault_entry.value = value;
      return vault_entry;
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna una entry del vault
  static async update_vault_entry(vault_id, key, value, is_sensitive) {
    try {
      // Validazione key
      if (!key || !key.trim()) {
        throw new Error("La chiave è obbligatoria");
      }

      // Ottiene l'entry corrente per salvare nella history
      const current_entry = await prisma.vault.findUnique({
        where: {
          vault_id: BigInt(vault_id),
        },
      });

      if (!current_entry) {
        throw new Error("Entry del vault non trovata");
      }

      // Verifica se la chiave esiste già per questo progetto (escludendo l'entry corrente)
      if (key.trim() !== current_entry.key) {
        const existing = await prisma.vault.findUnique({
          where: {
            project_id_key: {
              project_id: current_entry.project_id,
              key: key.trim(),
            },
          },
        });

        if (existing) {
          throw new Error("Questa chiave esiste già per questo progetto");
        }
      }

      // Determina se il valore è sensibile
      const final_is_sensitive =
        is_sensitive !== undefined ? is_sensitive : current_entry.is_sensitive;

      // Cifra il valore se sensibile
      let encrypted_value = value;
      if (final_is_sensitive && value) {
        try {
          encrypted_value = VaultEncryptionService.encrypt(value);
        } catch (error) {
          console.error("Errore nella cifratura del valore:", error);
          throw new Error("Impossibile cifrare il valore sensibile");
        }
      }

      // Salva nella history prima di aggiornare (con valore decifrato per la history)
      let history_value = current_entry.value;
      if (current_entry.is_sensitive) {
        try {
          history_value = VaultEncryptionService.decrypt(current_entry.value);
        } catch (error) {
          console.error("Errore nella decifratura per history:", error);
          history_value = current_entry.value; // Mantieni cifrato se errore
        }
      }

      await prisma.vault_History.create({
        data: {
          vault_id: BigInt(vault_id),
          key: current_entry.key,
          value: history_value,
          is_sensitive: current_entry.is_sensitive,
        },
      });

      // Aggiorna l'entry
      const updated_entry = await prisma.vault.update({
        where: {
          vault_id: BigInt(vault_id),
        },
        data: {
          key: key.trim(),
          value: encrypted_value,
          is_sensitive: final_is_sensitive,
        },
      });

      // Restituisci il valore decifrato per la risposta
      updated_entry.value = value;
      return updated_entry;
    } catch (error) {
      throw error;
    }
  }

  // Elimina una entry del vault
  static async delete_vault_entry(vault_id) {
    try {
      // Ottieni l'entry prima di eliminarla per il log
      const entry = await prisma.vault.findUnique({
        where: {
          vault_id: BigInt(vault_id),
        },
      });

      if (!entry) {
        throw new Error("Entry del vault non trovata");
      }

      // Elimina prima la history
      await prisma.vault_History.deleteMany({
        where: {
          vault_id: BigInt(vault_id),
        },
      });

      // Elimina l'entry
      const deleted_entry = await prisma.vault.delete({
        where: {
          vault_id: BigInt(vault_id),
        },
      });

      return deleted_entry;
    } catch (error) {
      throw error;
    }
  }

  // Ottiene la cronologia di una entry del vault
  static async get_vault_history(vault_id) {
    try {
      const history = await prisma.vault_History.findMany({
        where: {
          vault_id: BigInt(vault_id),
        },
        orderBy: {
          changed_at: "desc",
        },
      });

      return history;
    } catch (error) {
      throw error;
    }
  }

  // Ottiene tutte le entry del vault per l'export (con valori decifrati)
  static async get_vault_entries_for_export(
    project_id,
    filter_sensitive = false
  ) {
    try {
      const vault_entries = await prisma.vault.findMany({
        where: {
          project_id: BigInt(project_id),
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Decifra tutti i valori (anche sensibili per l'export)
      const decrypted_entries = vault_entries.map((entry) => {
        if (entry.is_sensitive && entry.value) {
          try {
            entry.value = VaultEncryptionService.decrypt(entry.value);
          } catch (error) {
            console.error(
              `Errore nella decifratura del vault_id ${entry.vault_id}:`,
              error
            );
            // Mantieni il valore cifrato in caso di errore
          }
        }
        return entry;
      });

      // Filtra i valori sensibili se richiesto
      if (filter_sensitive) {
        return decrypted_entries.filter((entry) => !entry.is_sensitive);
      }

      return decrypted_entries;
    } catch (error) {
      throw error;
    }
  }

  static async update_project(project_data) {
    try {
      const startDate = new Date(project_data.start_date + "T00:00:00.000Z");
      const endDate = new Date(project_data.end_date + "T23:59:59.999Z");
      const project = prisma.$transaction(async (tx) => {
        // Aggiorna il progetto
        const updatedProject = await tx.project.update({
          where: { project_id: parseInt(project_data.project_id) },
          data: {
            name: project_data.name,
            description: project_data.description,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            project_status_id: parseInt(project_data.project_status_id),
            updated_at: new Date(),
          },
        });
        return updatedProject;
      });

      return project;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProjectModel;
