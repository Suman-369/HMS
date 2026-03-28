import app from "./src/app.js";
import { listenToUserCreated } from "./src/broker/listener.js";
import { connect } from "./src/broker/rabbit.js";

async function start() {
  try {
    await connect();
    await listenToUserCreated();
    console.log("RabbitMQ listener started");
  } catch (err) {
    console.error("Failed to set up RabbitMQ listener", err);
    process.exit(1);
  }
}

start();

app.listen(3001, () => {
  console.log("Notification service is running on port 3001");
});
