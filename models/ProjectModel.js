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

  static async get_projects(filters = {}) {
    try {
      // Build the where clause based on filters
      const whereClause = {};

      // Filter by project status
      if (filters.status) {
        whereClause.project_status_id = parseInt(filters.status);
      }

      // Filter by start date (projects starting from this date or later)
      if (filters.startDate) {
        whereClause.start_date = {
          gte: new Date(filters.startDate),
        };
      }

      // Filter by end date (projects ending before or on this date)
      if (filters.endDate) {
        whereClause.end_date = {
          lte: new Date(filters.endDate),
        };
      }

      // Filter by team member
      if (filters.teamMember) {
        whereClause.project_members = {
          some: {
            user_id: parseInt(filters.teamMember),
          },
        };
      }

      // Filter by search term (name or description)
      if (filters.search) {
        whereClause.OR = [
          {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: filters.search,
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
}

module.exports = ProjectModel;
