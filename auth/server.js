import app from "./src/app.js";
import ConnectDB from "./src/db/db.js";
import { connect } from "./src/broker/rabbit.js";

ConnectDB();
connect();

const  PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});
