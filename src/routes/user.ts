import express from 'express'
import { createConfig, updateConfig, getAllUsers, getUserById } from '@/controllers/userController'

/**
 * @swagger
 * tags:
 *   name: User Config
 *   description: User configuration endpoints
 */
/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [User Config]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: User configuration object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalUsers:
 *                           type: integer
 *                           example: 50
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error while retrieving users"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Config]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: User configuration object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error while retrieving user"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
/**
 * @swagger
 * /api/user/create-config:
 *   post:
 *     summary: Create a new DCA configuration
 *     tags: [User Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stepSize:
 *                 type: string
 *                 description: Maximum amount to invest per trade in USD
 *                 example: "50"
 *               slippageTolerance:
 *                 type: string
 *                 description: Acceptable slippage percentage
 *                 minimum: 0
 *                 maximum: 100
 *                 example: "1"
 *               maxPrice:
 *                 type: string
 *                 description: Upper price limit for token purchase
 *                 example: "3000"
 *               minPrice:
 *                 type: string
 *                 description: Lower price limit for token purchase
 *                 example: "1000"
 *               initialCapital:
 *                 type: string
 *                 description: Initial capital allocated for DCA in USD
 *                 example: "1000"
 *               capital:
 *                 type: string
 *                 description: Current capital allocated for DCA in USD
 *                 example: "1000"
 *               isStop:
 *                 type: boolean
 *                 description: Flag to indicate if DCA is paused
 *                 example: false
 *               priceBuyHistory:
 *                 type: string
 *                 description: Price buy history
 *                 example: ""
 *               tokenInput:
 *                 type: string
 *                 description: Input token symbol
 *                 example: "ETH"
 *               ratioPriceUp:
 *                 type: string
 *                 description: Ratio price up
 *                 example: "5"
 *               ratioPriceDown:
 *                 type: string
 *                 description: Ratio price down
 *                 example: "1"
 *               amountUSDToBuy:
 *                 type: string
 *                 description: Current total USD amount invested
 *                 example: "0"
 *               amountETHBought:
 *                 type: string
 *                 description: Amount ETH bought
 *                 example: "0"
 *               version:
 *                 type: number
 *                 description: Configuration version
 *                 example: 1
 *               ratioProfitToSell:
 *                 type: string
 *                 description: Take profit percentage to sell
 *                 example: "5"
 *               ratioPriceByHistory:
 *                type: string
 *                description: Price drop ratio based on history
 *                example: "1"
 *     responses:
 *       200:
 *         description: User configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Created user configuration
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error while creating user"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
/**
 * @swagger
 * /api/user/update-config/{id}:
 *   post:
 *     summary: Update an existing DCA configuration
 *     tags: [User Config]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stepSize:
 *                 type: string
 *                 description: Maximum amount to invest per trade in USD
 *                 example: "50"
 *               slippageTolerance:
 *                 type: string
 *                 description: Acceptable slippage percentage
 *                 minimum: 0
 *                 maximum: 100
 *                 example: "1"
 *               maxPrice:
 *                 type: string
 *                 description: Upper price limit for token purchase
 *                 example: "3000"
 *               minPrice:
 *                 type: string
 *                 description: Lower price limit for token purchase
 *                 example: "1000"
 *               initialCapital:
 *                 type: string
 *                 description: Initial capital allocated for DCA in USD
 *                 example: "1000"
 *               capital:
 *                 type: string
 *                 description: Current capital allocated for DCA in USD
 *                 example: "1000"
 *               isStop:
 *                 type: boolean
 *                 description: Flag to indicate if DCA is paused
 *                 example: false
 *               priceBuyHistory:
 *                 type: string
 *                 description: Price buy history
 *                 example: ""
 *               tokenInput:
 *                 type: string
 *                 description: Input token symbol
 *                 example: "ETH"
 *               ratioPriceUp:
 *                 type: string
 *                 description: Ratio price up
 *                 example: "5"
 *               ratioPriceDown:
 *                 type: string
 *                 description: Ratio price down
 *                 example: "1"
 *               amountUSDToBuy:
 *                 type: string
 *                 description: Current total USD amount invested
 *                 example: "0"
 *               amountETHBought:
 *                 type: string
 *                 description: Amount ETH bought
 *                 example: "0"
 *               version:
 *                 type: number
 *                 description: Configuration version
 *                 example: 1
 *               ratioProfitToSell:
 *                 type: string
 *                 description: Take profit percentage to sell
 *                 example: "5"
 *               ratioPriceByHistory:
 *                type: string
 *                description: Price drop ratio based on history
 *                example: "1"
 *     responses:
 *       200:
 *         description: User configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Updated user configuration
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error while creating user"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */



const router = express.Router()

// No auth required
router.get('/list', getAllUsers)
router.get('/:id', getUserById)
router.post('/create-config', createConfig)
router.post('/update-config/:id', updateConfig)



export default router
