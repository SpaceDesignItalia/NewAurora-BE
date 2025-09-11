const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class ProjectModel {
  static async create_project(project_data, user_id) {
    try {
      const project_data_to_create = {
        name: project_data.name,
        description: project_data.description,
        start_date: project_data.startDate,
        end_date: project_data.endDate,
        project_status_id: project_data.projectStatus,
        created_by_id: user_id,
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

  static async get_projects() {
    try {
      const projects = await prisma.project.findMany({
        include: {
          project_status: true,
          created_by: true,
          project_members: true,
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
}

module.exports = ProjectModel;
