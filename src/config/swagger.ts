import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import fs from 'fs'

// Determine runtime context (src vs dist)
const isDistRuntime = __dirname.includes(`${path.sep}dist${path.sep}`)
const projectRoot = process.cwd()
const srcDir = path.join(projectRoot, 'src')

// Build list of glob patterns to feed swagger-jsdoc.
// Prefer reading original TypeScript sources (retain JSDoc) even when executing compiled dist code.
const apiGlobs: string[] = []

if (fs.existsSync(srcDir)) {
  apiGlobs.push(
    path.join(srcDir, 'routes/*.ts'),
    path.join(srcDir, 'controllers/*.ts'),
    path.join(srcDir, 'models/*.ts')
  )
}

// Fallback to .js in dist (only works if comments are preserved)
if (isDistRuntime) {
  apiGlobs.push(
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../models/*.js')
  )
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Bot DCA Token API',
      version: '1.0.0',
      description: 'API documentation for DCA token bot (Auth, Tokens, DCA, Strategy)'
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local dev' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: apiGlobs
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
