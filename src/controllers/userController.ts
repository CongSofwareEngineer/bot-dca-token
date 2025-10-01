import { AuthRequest } from '@/middleware/auth'
import User, { IUser } from '@/models/User'
import { Response } from 'express'

export const createConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as IUser
    const user = await User.create(body)
    res.status(200).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: error.message
    })
  }
}

export const updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as IUser
    const user = await User.updateOne({ _id: req.params.id }, body)
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: error.message
    })
  }
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalUsers = await User.countDocuments({})
    const totalPages = Math.ceil(totalUsers / limit)

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving users',
      error: errorMessage
    })
  }
}

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const user = await User.findById(id).select('-__v').lean()

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving user',
      error: errorMessage
    })
  }
}
