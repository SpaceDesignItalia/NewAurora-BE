const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class ProjectModel {
  static async create_project(project_data, user_id) {
    try {
      const project_data_to_create = {
        name: project_data.name,
        description: project_data.description,
        start_date: project_data.startDate
          ? new Date(project_data.startDate)
          : null,
        end_date: project_data.endDate ? new Date(project_data.endDate) : null,
        project_status_id: parseInt(project_data.projectStatus),
        created_by_id: parseInt(user_id),
      };

      const project = await prisma.$transaction(async (tx) => {
        // Crea il progetto
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
}

module.exports = ProjectModel;
