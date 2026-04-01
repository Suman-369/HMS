import app from "./src/app.js";
import connectDB from "./src/db/db.js";

connectDB().then(() => {
  app.listen(3003, () => {
    console.log("Complaint Service is running on port 3003");
  });
});