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
    console.log(unique_id);
    try {
      const project = await prisma.project.findUnique({
        where: { unique_id: unique_id },
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
}

module.exports = ProjectModel;
