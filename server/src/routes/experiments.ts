import express from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const createExperimentSchema = z.object({
  name: z.string().min(1, 'Experiment name is required'),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  trafficAllocation: z.number().min(0).max(1).default(1.0),
  confidenceLevel: z.number().min(0).max(1).default(0.95),
  minimumSampleSize: z.number().min(1).default(1000),
  targetingRules: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

const updateExperimentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  status: z.enum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional(),
  trafficAllocation: z.number().min(0).max(1).optional(),
  confidenceLevel: z.number().min(0).max(1).optional(),
  minimumSampleSize: z.number().min(1).optional(),
  targetingRules: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Public endpoint for SDK to get active experiments
router.get('/active', async (req, res) => {
  try {
    const { apiKey } = req.query
    
    if (!apiKey) {
      return res.status(401).json({ message: 'API key required' })
    }
    
    // Find project by API key
    const project = await prisma.project.findUnique({
      where: { apiKey: apiKey as string }
    })
    
    if (!project) {
      return res.status(401).json({ message: 'Invalid API key' })
    }
    
    // Get running experiments for this project
    const experiments = await prisma.experiment.findMany({
      where: { 
        projectId: project.id,
        status: 'RUNNING'
      },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            allocation: true,
            modifications: true
          }
        },
        goals: {
          select: {
            id: true,
            name: true,
            type: true,
            isPrimary: true
          }
        }
      }
    })
    
    // Transform data for SDK
    const transformedExperiments = experiments.map(exp => ({
      id: exp.id,
      name: exp.name,
      status: exp.status.toLowerCase(),
      variants: exp.variants,
      trafficAllocation: exp.trafficAllocation * 100, // SDK expects 0-100
      targetingRules: exp.targetingRules ? JSON.parse(exp.targetingRules) : null
    }))
    
    return res.json({ experiments: transformedExperiments })
  } catch (error) {
    console.error('Error fetching active experiments:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// All other routes require authentication
router.use(authenticateToken)

// Get all experiments
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId, status } = req.query
    
    const whereClause: any = { userId }
    
    if (projectId) {
      whereClause.projectId = projectId as string
    }
    
    if (status) {
      whereClause.status = status as string
    }
    
    const experiments = await prisma.experiment.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true }
        },
        variants: {
          select: { id: true, name: true, isControl: true, allocation: true }
        },
        goals: {
          select: { id: true, name: true, type: true, isPrimary: true }
        },
        _count: {
          select: { events: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return res.json(experiments)
  } catch (error) {
    console.error('Error fetching experiments:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get experiment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    const experiment = await prisma.experiment.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: { id: true, name: true, domain: true }
        },
        variants: {
          include: {
            _count: {
              select: { events: true }
            }
          }
        },
        goals: true,
        events: {
          take: 100,
          orderBy: { timestamp: 'desc' },
          include: {
            variant: {
              select: { id: true, name: true }
            },
            goal: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        _count: {
          select: { events: true, variants: true, goals: true }
        }
      }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    return res.json(experiment)
  } catch (error) {
    console.error('Error fetching experiment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Create new experiment
router.post('/', async (req, res) => {
  try {
    const data = createExperimentSchema.parse(req.body)
    const userId = req.user!.userId
    
    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId }
    })
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    
    const experiment = await prisma.experiment.create({
      data: {
        ...data,
        userId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        variants: true,
        goals: true
      }
    })
    
    return res.status(201).json(experiment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error creating experiment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Update experiment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const updates = updateExperimentSchema.parse(req.body)
    
    const experiment = await prisma.experiment.findFirst({
      where: { id, userId }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    const updateData: any = { ...updates }
    
    if (updates.startDate) {
      updateData.startDate = new Date(updates.startDate)
    }
    
    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate)
    }
    
    const updatedExperiment = await prisma.experiment.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true }
        },
        variants: true,
        goals: true
      }
    })
    
    return res.json(updatedExperiment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error updating experiment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete experiment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    const experiment = await prisma.experiment.findFirst({
      where: { id, userId }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    await prisma.experiment.delete({
      where: { id }
    })
    
    return res.json({ message: 'Experiment deleted successfully' })
  } catch (error) {
    console.error('Error deleting experiment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Create variant for experiment
router.post('/:id/variants', async (req, res) => {
  try {
    const { id: experimentId } = req.params
    const userId = req.user!.userId
    
    const variantSchema = z.object({
      name: z.string().min(1, 'Variant name is required'),
      description: z.string().optional(),
      isControl: z.boolean().default(false),
      allocation: z.number().min(0).max(1).default(0.5),
      modifications: z.string().optional()
    })
    
    const data = variantSchema.parse(req.body)
    
    // Verify experiment exists and belongs to user
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    const variant = await prisma.variant.create({
      data: {
        ...data,
        experimentId
      }
    })
    
    return res.status(201).json(variant)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error creating variant:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Create goal for experiment
router.post('/:id/goals', async (req, res) => {
  try {
    const { id: experimentId } = req.params
    const userId = req.user!.userId
    
    const goalSchema = z.object({
      name: z.string().min(1, 'Goal name is required'),
      description: z.string().optional(),
      type: z.enum(['PAGE_VIEW', 'CLICK', 'CUSTOM_EVENT', 'REVENUE']),
      selector: z.string().optional(),
      url: z.string().optional(),
      eventName: z.string().optional(),
      isPrimary: z.boolean().default(false)
    })
    
    const data = goalSchema.parse(req.body)
    
    // Verify experiment exists and belongs to user
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    const goal = await prisma.goal.create({
      data: {
        ...data,
        experimentId
      }
    })
    
    return res.status(201).json(goal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error creating goal:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Create new variant for experiment
router.post('/:id/variants', async (req, res) => {
  try {
    const { id: experimentId } = req.params
    const { name, description, isControl, allocation, modifications } = req.body
    const userId = req.user!.userId
    
    // Validate input
    if (!name || typeof allocation !== 'number' || allocation < 0 || allocation > 1) {
      return res.status(400).json({ message: 'Name is required and allocation must be between 0 and 1' })
    }
    
    // Find experiment and verify ownership
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId },
      include: { variants: true }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    // Create variant
    const variant = await prisma.variant.create({
      data: {
        name,
        description,
        isControl: isControl || false,
        allocation, // Already converted to decimal in frontend
        modifications: modifications || '{}',
        experimentId
      }
    })
    
    return res.status(201).json(variant)
  } catch (error) {
    console.error('Error creating variant:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete variant
router.delete('/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params
    const userId = req.user!.userId
    
    // Find variant and verify ownership through experiment
    const variant = await prisma.variant.findFirst({
      where: { 
        id: variantId,
        experiment: {
          userId
        }
      },
      include: {
        experiment: {
          include: {
            variants: true
          }
        }
      }
    })
    
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' })
    }
    
    // Prevent deleting the last variant
    if (variant.experiment.variants.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last variant' })
    }
    
    // Delete the variant
    await prisma.variant.delete({
      where: { id: variantId }
    })
    
    // Rebalance remaining variants to maintain 100% allocation
    const remainingVariants = variant.experiment.variants.filter(v => v.id !== variantId)
    const totalRemainingAllocation = remainingVariants.reduce((sum, v) => sum + v.allocation, 0)
    
    if (totalRemainingAllocation > 0) {
      const rebalanceFactor = 1.0 / totalRemainingAllocation
      
      for (const remainingVariant of remainingVariants) {
        await prisma.variant.update({
          where: { id: remainingVariant.id },
          data: { allocation: remainingVariant.allocation * rebalanceFactor }
        })
      }
    }
    
    return res.json({ message: 'Variant deleted and allocations rebalanced' })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete experiment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    // Find experiment and verify ownership
    const experiment = await prisma.experiment.findFirst({
      where: { id, userId }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    // Delete experiment (this will cascade delete variants, goals, events due to foreign key constraints)
    await prisma.experiment.delete({
      where: { id }
    })
    
    return res.json({ message: 'Experiment deleted successfully' })
  } catch (error) {
    console.error('Error deleting experiment:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Update variant
router.put('/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params
    const { name, description, isControl, allocation, modifications } = req.body
    const userId = req.user!.userId
    
    // Find variant and verify ownership through experiment
    const variant = await prisma.variant.findFirst({
      where: { 
        id: variantId,
        experiment: {
          userId: userId
        }
      },
      include: {
        experiment: true
      }
    })
    
    if (!variant) {
      console.log('Variant not found for ID:', variantId)
      return res.status(404).json({ message: 'Variant not found' })
    }
    
    
    // Build update data object with only the fields we want to update
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isControl !== undefined) updateData.isControl = isControl
    if (allocation !== undefined) updateData.allocation = allocation
    if (modifications !== undefined) updateData.modifications = modifications
        
    // Update the variant
    const updatedVariant = await prisma.variant.update({
      where: { id: variantId },
      data: updateData
    })

    return res.json(updatedVariant)
  } catch (error) {
    console.error('Error updating variant:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
