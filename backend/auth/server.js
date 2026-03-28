import app from "./src/app.js";
import ConnectDB from "./src/db/db.js";
import { connect } from "./src/broker/rabbit.js";

ConnectDB();
connect();
app.listen(3000, () => {
  console.log("app running on port 3000");
});
