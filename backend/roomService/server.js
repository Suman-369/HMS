import app from "./src/app.js";
import connectDB from "./src/db/db.js";

connectDB().then(() => {
  app.listen(3002, () => {
    console.log("Room Service is running on port 3002");
  });
});