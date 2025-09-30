import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from '@/config/database'
import { errorHandler } from '@/middleware/auth'

// Import routes

import dcaStrategyRoutes from '@/routes/dcaStrategy'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger'

// Load environment variables
dotenv.config()

class App {
  public app: Application
  private port: string | number

  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000

    this.initializeDatabase()
    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private async initializeDatabase(): Promise<void> {
    console.log('initializeDatabase')

    await connectDB()
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet())

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      })
    )

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
      next()
    })
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Bot DCA Token API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      })
    })

    // API routes
    // this.app.use('/api/auth', authRoutes)
    // this.app.use('/api/tokens', tokenRoutes)
    // this.app.use('/api/dca', dcaRoutes) // Generic DCA routes - no auth required
    this.app.use('/api/dca', dcaStrategyRoutes) // Strategy-based ETH DCA

    // Swagger documentation
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    this.app.get('/api/docs.json', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerSpec)
    })
    // Optional redirect root -> docs
    this.app.get('/', (_req: Request, res: Response) => {
      res.redirect('/api/docs')
    })
    console.log('📘 Swagger docs available at /api/docs')

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      })
    })
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server is running on port ${this.port}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 Health check: http://localhost:${this.port}/health`)
    })
  }
}

// Create and start the application
const application = new App()
application.listen()

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

export default App
