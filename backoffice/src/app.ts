import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient();

export const app = new Elysia()
  .use(cors({
    origin: '*',
    credentials: true,
  }))
  .use(swagger())

export type App = typeof app;