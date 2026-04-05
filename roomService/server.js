import app from "./src/app.js";
import connectDB from "./src/db/db.js";

connectDB().then(() => {

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Room Service is running on port ${PORT}`);
  });
});