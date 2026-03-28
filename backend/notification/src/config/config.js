import {config as dotenvConfig} from "dotenv"

dotenvConfig()

const _config = {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    EMAIL_USER: process.env.EMAIL_USER,
    JWT_SECRET: process.env.JWT_SECRET,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
}

export default Object.freeze( _config)