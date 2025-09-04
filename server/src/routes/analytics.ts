import express from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const trackEventSchema = z.object({
  experimentId: z.string().min(1),
  variantId: z.string().optional(),
  goalId: z.string().optional(),
  type: z.enum(['EXPERIMENT_VIEW', 'GOAL_CONVERSION', 'CUSTOM']),
  value: z.number().optional(),
  properties: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional()
})

// Batch events endpoint for SDK
router.post('/events', async (req, res) => {
  try {
    const { events } = req.body
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Events array required' })
    }

    // For now, just log the events and return success
    // In a real implementation, you'd store these in the database
    console.log('Received', events.length, 'events from SDK')
    events.forEach(event => {
      console.log('Event:', event.type, event.data)
    })

    return res.json({ success: true, processed: events.length })
  } catch (error) {
    console.error('Error processing events:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Track event (public endpoint - no auth required for tracking)
router.post('/track', async (req, res) => {
  try {
    const data = trackEventSchema.parse(req.body)
    
    // Create event record
    const event = await prisma.event.create({
      data: {
        experimentId: data.experimentId,
        variantId: data.variantId,
        goalId: data.goalId,
        type: data.type,
        value: data.value,
        properties: data.properties ? JSON.stringify(data.properties) : null,
        sessionId: data.sessionId || `session-${Date.now()}`,
        userId: data.userId,
        userAgent: data.userAgent || req.get('User-Agent'),
        ip: data.ip || req.ip
      }
    })
    
    return res.json({ success: true, eventId: event.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    
    console.error('Error tracking event:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// All other routes require authentication
router.use(authenticateToken)

// Get analytics for experiment
router.get('/:experimentId', async (req, res) => {
  try {
    const { experimentId } = req.params
    const userId = req.user!.userId
    
    // Verify experiment belongs to user
    const experiment = await prisma.experiment.findFirst({
      where: { id: experimentId, userId },
      include: {
        variants: true,
        goals: true
      }
    })
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' })
    }
    
    // Get event counts by variant
    const variantStats = await Promise.all(
      experiment.variants.map(async (variant) => {
        const views = await prisma.event.count({
          where: {
            experimentId,
            variantId: variant.id,
            type: 'EXPERIMENT_VIEW'
          }
        })
        
        const conversions = await prisma.event.count({
          where: {
            experimentId,
            variantId: variant.id,
            type: 'GOAL_CONVERSION'
          }
        })
        
        const conversionRate = views > 0 ? (conversions / views) * 100 : 0
        
        return {
          variant: variant,
          stats: {
            views,
            conversions,
            conversionRate: Math.round(conversionRate * 100) / 100
          }
        }
      })
    )
    
    // Get recent events
    const recentEvents = await prisma.event.findMany({
      where: { experimentId },
      include: {
        variant: {
          select: { name: true }
        },
        goal: {
          select: { name: true, type: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })
    
    return res.json({
      experiment,
      variantStats,
      recentEvents,
      totalEvents: recentEvents.length
    })
  } catch (error) {
    console.error('Error fetching experiment analytics:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
