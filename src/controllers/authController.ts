import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '@/models/User'
import { JWTPayload } from '@/types'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      })
      return
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    })

    await user.save()

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      })
      return
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        token
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
      return
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
      return
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      })
      return
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' })

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        token
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId

    const user = await User.findById(userId).select('-password')
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile',
      error: error.message
    })
  }
}
