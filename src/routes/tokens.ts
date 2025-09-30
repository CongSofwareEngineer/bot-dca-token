import express from 'express'
import {
  createToken
} from '@/controllers/tokenController'
import { authenticateToken } from '@/middleware/auth'

/**
 * @swagger
 * tags:
 *   name: Tokens
 *   description: User token portfolio management
 */
/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: List tokens
 *     tags: [Tokens]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Token list
 */

const router = express.Router()

// All token routes require authentication
router.use(authenticateToken)

// Token CRUD operations
router.post('/', createToken)
// router.get('/', getTokens)
// router.get('/:id', getTokenById)
// router.put('/:id', updateToken)
// router.delete('/:id', deleteToken)
// router.patch('/:id/toggle', toggleTokenStatus)

export default router
