const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class ProjectModel {
  static async create_project(project_data) {
    try {
      const project = await prisma.project.create({
        data: project_data,
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
