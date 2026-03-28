import { subscribeToQueue } from "./rabbit.js";

import sendEmail from "../utils/email.js";
export async function listenToUserCreated() {
    await subscribeToQueue("user_created", async (msg) => {

        const { email, role, fullname: { firstName, lastName } } = msg;

       const template = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial; line-height: 1.6;">
    <p>Hi ${firstName || "User"} ${lastName || ""},</p>
    
    <h2 style="color: #4CAF50;">
      Thank you for registering as a ${role || "member"} 
    </h2>
    
    <p>We're excited to have you on our aplication !</p>
    
    <br/>
    <p>Best regards,</p>
    <p><strong>The HMS Team</strong></p>
  </body>
</html>
`;
        await sendEmail(email, "Welcome to HMS", template);
    });
}
