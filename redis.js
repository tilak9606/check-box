import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.REDIS_URL;

export const publisher = new Redis(url);
export const subscriber = new Redis(url);
export const redis = new Redis(url);