import express from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required')
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  domain: z.string().min(1).optional()
})

// All routes require authentication
router.use(authenticateToken)

// Get all projects
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { experiments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, domain } = createProjectSchema.parse(req.body)
    const userId = req.user!.userId
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        domain,
        userId
      }
    })
    
    return res.status(201).json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error creating project:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        experiments: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { variants: true, events: true }
            }
          }
        }
      }
    })
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    
    return res.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const updates = updateProjectSchema.parse(req.body)
    
    const project = await prisma.project.findFirst({
      where: { id, userId }
    })
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updates
    })
    
    return res.json(updatedProject)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error updating project:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    const project = await prisma.project.findFirst({
      where: { id, userId }
    })
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    
    await prisma.project.delete({
      where: { id }
    })
    
    return res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
