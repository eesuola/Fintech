import app from "./app.js";
import  connectDB  from "./config/db.js";
import dotenv from "dotenv"


//Load Environment Variables
dotenv.config();
const connectionString = process.env.MONGO_URI;
const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV || "development";


connectDB()

//Database Connection
async function startServer() {
  try {
   await connectDB(connectionString);
    console.log("Database Connected Successfully");

    const server = app.listen(PORT, () => {
      console.log(`Business running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`server URL: http://localhost:${PORT}`);
    });
    process.once(`SIGTERM`, () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("process terminated");
      });
    });
  } catch (error) {
    console.error("failed to start server", error);
    process.exit(1);
  }
}
startServer();
