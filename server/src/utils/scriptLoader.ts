import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Loads the element selector script from the separate JavaScript file
 * and wraps it in a script tag for injection
 */
export const getElementSelectorScript = (): string => {
  try {
    const scriptPath = join(__dirname, 'elementSelector.js')
    const scriptContent = readFileSync(scriptPath, 'utf-8')
    
    return `
      <script id="simpleab-selector">
        ${scriptContent}
      </script>
    `
  } catch (error) {
    console.error('Failed to load element selector script:', error)
    // Fallback to empty script if file can't be read
    return '<script id="simpleab-selector">console.warn("Element selector script failed to load");</script>'
  }
}
