/**
 * SimpleAB JavaScript SDK
 * A comprehensive A/B testing SDK for client-side experiment tracking and variant delivery
 */

export interface SimpleABConfig {
  apiKey: string
  apiUrl?: string
  userId?: string
  sessionId?: string
  enableLogging?: boolean
  timeout?: number
  retryAttempts?: number
}

export interface ExperimentVariant {
  id: string
  name: string
  isControl: boolean
  allocation: number
  modifications?: Record<string, any>
}

export interface Experiment {
  id: string
  name: string
  status: 'running' | 'paused' | 'completed'
  variants: ExperimentVariant[]
  trafficAllocation: number
  targetingRules?: Record<string, any>
}

export interface EventData {
  experimentId?: string
  variantId?: string
  goalId?: string
  value?: number
  properties?: Record<string, any>
}

export interface UserContext {
  userId?: string
  sessionId: string
  userAgent: string
  url: string
  referrer: string
  timestamp: number
  customAttributes?: Record<string, any>
}

class SimpleABSDK {
  private config: SimpleABConfig
  private userContext: UserContext
  private experiments: Map<string, Experiment> = new Map()
  private assignments: Map<string, string> = new Map() // experimentId -> variantId
  private eventQueue: Array<{ type: string; data: any }> = []
  private isInitialized = false
  private flushTimer?: number

  constructor() {
    this.config = {} as SimpleABConfig
    this.userContext = this.createUserContext()
  }

  /**
   * Initialize the SDK with configuration
   */
  async init(config: SimpleABConfig): Promise<void> {
    this.config = {
      apiUrl: 'https://api.simpleab.com',
      enableLogging: false,
      timeout: 5000,
      retryAttempts: 3,
      ...config
    }

    this.userContext = this.createUserContext()
    
    if (config.userId) {
      this.userContext.userId = config.userId
    }

    if (config.sessionId) {
      this.userContext.sessionId = config.sessionId
    }

    try {
      await this.loadExperiments()
      this.startEventFlushing()
      this.isInitialized = true
      
      // Automatically apply modifications for all running experiments
      this.applyAllExperiments()
      
      this.log('SimpleAB SDK initialized successfully')
    } catch (error) {
      this.log('Failed to initialize SimpleAB SDK:', error)
      throw error
    }
  }

  /**
   * Get variant for a specific experiment
   */
  getVariant(experimentId: string, userId?: string): ExperimentVariant | null {
    if (!this.isInitialized) {
      this.log('SDK not initialized. Call init() first.')
      return null
    }

    const experiment = this.experiments.get(experimentId)
    if (!experiment || experiment.status !== 'running') {
      return null
    }

    // Check if user is already assigned to this experiment
    let variantId = this.assignments.get(experimentId)
    
    if (!variantId) {
      // Assign user to variant
      variantId = this.assignVariant(experiment, userId || this.userContext.userId) || undefined
      if (variantId) {
        this.assignments.set(experimentId, variantId)
        // Track experiment view
        this.track('experiment_view', {
          experimentId,
          variantId
        })
      }
    }

    return experiment.variants.find(v => v.id === variantId) || null
  }

  /**
   * Track an event
   */
  track(eventType: string, data: EventData = {}): void {
    if (!this.isInitialized) {
      this.log('SDK not initialized. Call init() first.')
      return
    }

    const event = {
      type: eventType,
      data: {
        ...data,
        sessionId: this.userContext.sessionId,
        userId: this.userContext.userId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...this.userContext.customAttributes
      }
    }

    this.eventQueue.push(event)
    this.log('Event tracked:', event)

    // Flush immediately for important events
    if (['goal_conversion', 'experiment_view'].includes(eventType)) {
      this.flushEvents()
    }
  }

  /**
   * Track a goal conversion
   */
  trackGoal(goalId: string, data: Omit<EventData, 'goalId'> = {}): void {
    this.track('goal_conversion', { ...data, goalId })
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userContext.userId = userId
  }

  /**
   * Set custom user attributes
   */
  setUserAttributes(attributes: Record<string, any>): void {
    this.userContext.customAttributes = {
      ...this.userContext.customAttributes,
      ...attributes
    }
  }

  /**
   * Get current user context
   */
  getUserContext(): UserContext {
    return { ...this.userContext }
  }

  /**
   * Force flush all pending events
   */
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.sendEvents(events)
      this.log(`Flushed ${events.length} events`)
    } catch (error) {
      // Put events back in queue for retry
      this.eventQueue.unshift(...events)
      this.log('Failed to flush events:', error)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flushEvents() // Final flush
    this.isInitialized = false
  }

  // Private methods

  private createUserContext(): UserContext {
    return {
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    }
  }

  private generateSessionId(): string {
    // Try to get existing session ID from localStorage
    const existingSessionId = localStorage.getItem('simpleab_session_id')
    if (existingSessionId) {
      return existingSessionId
    }

    // Generate new session ID
    const sessionId = 'sess_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
    localStorage.setItem('simpleab_session_id', sessionId)
    return sessionId
  }

  private async loadExperiments(): Promise<void> {
    const response = await this.apiRequest(`/experiments/active?apiKey=${this.config.apiKey}`, {
      method: 'GET'
    })

    const experiments: Experiment[] = response.experiments || []
    
    experiments.forEach(exp => {
      this.experiments.set(exp.id, exp)
    })

    this.log(`Loaded ${experiments.length} experiments`)
  }

  private assignVariant(experiment: Experiment, userId?: string): string | null {
    // Check traffic allocation first
    if (Math.random() > experiment.trafficAllocation / 100) {
      this.log(`User excluded from experiment due to traffic allocation`)
      return null // User not in experiment
    }

    // Check targeting rules
    if (experiment.targetingRules && !this.matchesTargeting(experiment.targetingRules)) {
      this.log(`User excluded from experiment due to targeting rules`)
      return null
    }

    // Assign variant based on consistent hashing
    const seed = userId || this.userContext.sessionId
    const hash = this.hashString(experiment.id + seed)
    const normalizedHash = hash / 0xffffffff // Normalize to 0-1

    this.log(`Variant assignment debug:`)
    this.log(`- Seed: ${seed}`)
    this.log(`- Hash: ${hash}`)
    this.log(`- Normalized hash: ${normalizedHash}`)
    this.log(`- Variants:`, experiment.variants.map(v => ({ name: v.name, allocation: v.allocation })))

    let cumulativeAllocation = 0
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation
      this.log(`- Checking ${variant.name}: cumulative=${cumulativeAllocation}, hash=${normalizedHash}`)
      if (normalizedHash <= cumulativeAllocation) {
        this.log(`- Selected variant: ${variant.name}`)
        return variant.id
      }
    }

    // Fallback to control variant
    this.log(`- Fallback to control variant`)
    return experiment.variants.find(v => v.isControl)?.id || experiment.variants[0]?.id || null
  }

  private hashString(str: string): number {
    // FNV-1a hash algorithm for better distribution
    let hash = 2166136261 // FNV offset basis
    
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = (hash * 16777619) >>> 0 // FNV prime, keep as 32-bit unsigned
    }
    
    return hash
  }

  private matchesTargeting(rules: Record<string, any>): boolean {
    // Simple targeting logic - can be extended
    if (rules.url && !window.location.href.includes(rules.url)) {
      return false
    }
    
    if (rules.device) {
      const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
      if (rules.device === 'mobile' && !isMobile) return false
      if (rules.device === 'desktop' && isMobile) return false
    }

    return true
  }

  private startEventFlushing(): void {
    // Flush events every 10 seconds
    this.flushTimer = window.setInterval(() => {
      this.flushEvents()
    }, 10000)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents()
    })
  }

  private async sendEvents(events: Array<{ type: string; data: any }>): Promise<void> {
    await this.apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify({ events })
    })
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[SimpleAB]', ...args)
    }
  }

  /**
   * Automatically apply modifications for all running experiments
   */
  public applyAllExperiments(): void {
    this.experiments.forEach((experiment) => {
      if (experiment.status === 'running') {
        const variant = this.getVariant(experiment.id)
        if (variant) {
          this.applyVariantModifications(variant)
        }
      }
    })
  }

  /**
   * Apply modifications from a variant to the page
   */
  private applyVariantModifications(variant: ExperimentVariant): void {
    if (!variant.modifications) {
      this.log('No modifications found for variant:', variant.name)
      return
    }

    this.log('Applying modifications for variant:', variant.name)
    this.log('Raw modifications:', variant.modifications)
    this.log('Type of modifications:', typeof variant.modifications)

    let modifications
    try {
      // Parse modifications if it's a string
      modifications = typeof variant.modifications === 'string' 
        ? JSON.parse(variant.modifications) 
        : variant.modifications
      this.log('Parsed modifications:', modifications)
    } catch (error) {
      this.log('Failed to parse variant modifications:', error)
      return
    }

    // Handle flexible modification structure
    if (Array.isArray(modifications)) {
      this.log('Applying array of modifications:', modifications.length)
      // New flexible structure: array of modification objects
      modifications.forEach(mod => this.applyModification(mod))
    } else if (modifications.selector) {
      this.log('Applying single modification with selector:', modifications.selector)
      
      // Handle both new format and old "changes" format
      if (modifications.changes) {
        // Old format: {"selector": "#cta-button", "changes": {"style": {...}, "text": "..."}}
        this.log('Converting old "changes" format to new format')
        const convertedMod = {
          selector: modifications.selector,
          ...modifications.changes
        }
        this.applyModification(convertedMod)
      } else {
        // New format: {"selector": "#cta-button", "style": {...}, "text": "..."}
        this.applyModification(modifications)
      }
    } else if (modifications.style) {
      this.log('Applying legacy modification with style:', modifications.style)
      // Legacy structure: direct style object
      this.applyLegacyModification(modifications)
    } else {
      this.log('Unknown modification format:', modifications)
      // Try to handle any other format
      this.applyLegacyModification(modifications)
    }
  }

  /**
   * Apply a single modification to elements matching the selector
   */
  private applyModification(modification: any): void {
    const { selector, style, text, attributes, visibility } = modification
    
    if (!selector) {
      this.log('No selector specified for modification:', modification)
      return
    }

    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) {
      this.log(`No elements found for selector: ${selector}`)
      return
    }

    this.log(`Applying modification to ${elements.length} element(s) with selector: ${selector}`)

    elements.forEach(element => {
      const htmlElement = element as HTMLElement

      // Apply styles
      if (style && typeof style === 'object') {
        Object.entries(style).forEach(([property, value]) => {
          htmlElement.style.setProperty(property, value as string, 'important')
        })
      }

      // Apply text content
      if (text !== undefined) {
        this.log(`Setting text content to: "${text}"`)
        htmlElement.textContent = text
      }

      // Apply attributes
      if (attributes && typeof attributes === 'object') {
        Object.entries(attributes).forEach(([attr, value]) => {
          htmlElement.setAttribute(attr, value as string)
        })
      }

      // Apply visibility
      if (visibility !== undefined) {
        if (visibility === 'hidden' || visibility === false) {
          htmlElement.style.setProperty('display', 'none', 'important')
        } else if (visibility === 'visible' || visibility === true) {
          htmlElement.style.removeProperty('display')
        }
      }
    })
  }

  /**
   * Apply legacy modification format (direct style object)
   */
  private applyLegacyModification(modifications: any): void {
    // Default to common button selector for legacy support
    const defaultSelectors = ['#cta-button', '.cta-button', 'button', '.btn']
    
    for (const selector of defaultSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        this.log(`Applying legacy modifications to elements with selector: ${selector}`)
        elements.forEach(element => {
          const htmlElement = element as HTMLElement
          if (modifications.style) {
            Object.entries(modifications.style).forEach(([property, value]) => {
              htmlElement.style.setProperty(property, value as string, 'important')
            })
          }
        })
        break // Only apply to first matching selector
      }
    }
  }
}

// Global instance
const simpleAB = new SimpleABSDK()

// Export both the class and the instance
export { SimpleABSDK }
export default simpleAB

// Global window object for script tag usage
declare global {
  interface Window {
    SimpleAB: typeof simpleAB
  }
}

if (typeof window !== 'undefined') {
  window.SimpleAB = simpleAB
}
