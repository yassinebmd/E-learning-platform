import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { swagger } from '@elysiajs/swagger';
import { PrismaClient } from './generated/prisma/client';


export const db = new PrismaClient();



export const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }))
  .use(swagger())
  .use(jwt({
    name: 'jwt',
    
    secret: process.env.JWT_SECRET!,
    exp: '7d' 
  }));


export type App = typeof app;