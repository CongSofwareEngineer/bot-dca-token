import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = `mongodb+srv://${process.env.USER_NAME_MONGO}:${process.env.PASSWORD_MONGO}@tc-store-admin.mpkyxqj.mongodb.net/?retryWrites=true&w=majority&appName=dca-token`
    console.log({ mongoURI })


    await mongoose.connect(mongoURI, {
      dbName: 'dca-token'
    })

    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Xử lý sự kiện khi kết nối MongoDB bị ngắt
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

mongoose.connection.on('error', error => {
  console.error('MongoDB error:', error)
})

export default connectDB
