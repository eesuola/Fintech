import mongoose from "mongoose";

const connectDB = async (url) => {
  const connectionString = url || process.env.MONGO_URI;

  if (!connectionString) {
    throw new Error(" No MongoDB connection string provided.");
  }
  console.log("Connecting to database ");

  return mongoose.connect(connectionString, {}).then(
    () => {
      console.log(`connected to your database successfully`);
    },
    (error) => {
      console.log(`MongoDb connection error: ${error}`);
    }
  );
};

export default connectDB;
