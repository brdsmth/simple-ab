import express from 'express'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { getElementSelectorScript } from '../utils/scriptLoader'
import { URL } from 'url'

const router = express.Router()

// List of allowed domains for security (you can make this configurable)
const ALLOWED_DOMAINS = [
  // Add specific domains or use wildcard approach
  // 'example.com',
  // 'google.com'
  '*',
]

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10 // 10 requests per minute

  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isAllowedDomain = (url: URL): boolean => {
  // If no specific domains are configured, allow all (be careful in production)
  if (ALLOWED_DOMAINS.length === 0) {
    return true
  }
  
  // Check for wildcard
  if (ALLOWED_DOMAINS.includes('*')) {
    return true
  }
  
  return ALLOWED_DOMAINS.some(domain => 
    url.hostname === domain || url.hostname.endsWith('.' + domain)
  )
}


// Proxy endpoint
router.get('/:url(*)', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      })
    }

    let targetUrl = req.params.url
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL parameter is required' })
    }

    // Decode URL in case it was double-encoded
    targetUrl = decodeURIComponent(targetUrl)
    
    // Add protocol if missing
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
    
    console.log('Proxying request for:', targetUrl)

    // Validate URL
    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    const url = new URL(targetUrl)
    
    // Check if domain is allowed
    if (!isAllowedDomain(url)) {
      return res.status(403).json({ 
        error: 'Domain not allowed. Contact administrator to whitelist this domain.' 
      })
    }

    // Fetch the target website
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000, // 15 second timeout
      follow: 5, // Follow up to 5 redirects
    })

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch website: ${response.statusText}` 
      })
    }

    const contentType = response.headers.get('content-type') || ''
    
    // Only process HTML content
    if (!contentType.includes('text/html')) {
      // For non-HTML content, just proxy it through
      const buffer = await response.buffer()
      res.set({
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      })
      return res.send(buffer)
    }

    // Process HTML content
    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove any existing Content Security Policy headers that might block our script
    $('meta[http-equiv="Content-Security-Policy"]').remove()
    $('meta[http-equiv="X-Content-Security-Policy"]').remove()

    // Fix relative URLs to absolute URLs
    const baseUrl = `${url.protocol}//${url.host}`
    
    // Fix links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href && href.startsWith('/')) {
        $(element).attr('href', baseUrl + href)
      }
    })

    // Fix images
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src')
      if (src && src.startsWith('/')) {
        $(element).attr('src', baseUrl + src)
      }
    })

    // Fix CSS links
    $('link[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href && href.startsWith('/')) {
        $(element).attr('href', baseUrl + href)
      }
    })

    // Fix scripts
    $('script[src]').each((_, element) => {
      const src = $(element).attr('src')
      if (src && src.startsWith('/')) {
        $(element).attr('src', baseUrl + src)
      }
    })

    // Inject our element selector script before closing body tag
    const selectorScript = getElementSelectorScript()
    $('body').append(selectorScript)

    // Set CORS headers and return the modified HTML
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Frame-Options': 'SAMEORIGIN', // Allow embedding in iframes from same origin
    })
    
    // Remove CSP headers that would block iframe embedding
    res.removeHeader('Content-Security-Policy')
    res.removeHeader('X-Content-Security-Policy')
    res.removeHeader('X-WebKit-CSP')

    return res.send($.html())

  } catch (error) {
    console.error('Proxy error:', error)
    
    if (error && typeof error === 'object' && ('name' in error || 'code' in error)) {
      const err = error as { name?: string; code?: string }
      if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
        return res.status(408).json({ error: 'Request timeout. The website took too long to respond.' })
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to proxy website. Please try again later.' 
    })
  }
})

export default router
