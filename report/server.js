import app from './src/app.js';
import ConnectDB from './src/db/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;

ConnectDB();


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})