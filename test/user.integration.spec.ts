import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as request from 'supertest';
import { Client } from 'pg';
import { AppModule } from '../src/app.module';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import { UserDto } from 'src/dto/user.dto';
import { randomUUID } from 'crypto';

let container: StartedPostgreSqlContainer;
let prismaClient: PrismaClient;
let app: INestApplication;
let urlConnection: string;
let client: Client;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  client = new Client({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });
  await client.connect();
  process.env.DATABASE_URL = container.getConnectionUri();
  urlConnection = container.getConnectionUri();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());

  // create a new instance of PrismaClient with the connection string
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: urlConnection,
      },
    },
  });

  // start the application
  await app.init();
});

afterAll(async () => {
  await prismaClient.$disconnect();
  await client.end();
  await container.stop();
});

beforeEach(async () => {
  // drop schema and create a new one
  execSync(`npx prisma migrate reset --force`, {
    env: {
      ...process.env,
      DATABASE_URL: urlConnection,
    },
  });
  execSync(`npx prisma migrate deploy`, {
    env: {
      ...process.env,
      DATABASE_URL: urlConnection,
    },
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('[/user] POST', () => {
  it('should create a user', async () => {
    const userData: UserDto = {
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password@1234',
    };
    await request(app.getHttpServer()).post('/user').send(userData).expect(201);

    const userDb = await prismaClient.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(userDb).toBeTruthy();
    expect(userDb.email).toBe(userData.email);
    expect(userDb.first_name).toBe(userData.first_name);
    expect(userDb.last_name).toBe(userData.last_name);
    expect(userDb.password).not.toBe(userData.password);
    expect(userDb.created_at).toBeTruthy();
  });

  it('should not create a user with invalid data', async () => {
    const userData: UserDto = {
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password@1234',
    };
    await prismaClient.user.create({
      data: userData,
    });

    const response = await request(app.getHttpServer())
      .post('/user')
      .send(userData)
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'user already exists',
      error: 'Bad Request',
    });
  });

  it('should be able to update user', async () => {
    const userData: UserDto = {
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password@1234',
    };
    const userdb = await prismaClient.user.create({
      data: userData,
    });

    await request(app.getHttpServer())
      .patch(`/user/${userdb.id}`)
      .send({
        first_name: 'John Doe Updated',
      })
      .expect(200);

    const userUpdated = await prismaClient.user.findUnique({
      where: {
        id: userdb.id,
      },
    });
    expect(userUpdated.first_name).toBe('John Doe Updated');
  });

  it("should not be able to update user that doesn't exist", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/user/${randomUUID()}`)
      .send({
        first_name: 'John Doe Updated',
      })
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'user not found',
      error: 'Not Found',
    });
  });

  it('should not be able to update user with email already in use', async () => {
    const userData: UserDto = {
      email: 'john.doe@email.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'password@1234',
    };
    const userDb = await prismaClient.user.create({
      data: userData,
    });

    const response = await request(app.getHttpServer())
      .patch(`/user/${userDb.id}`)
      .send({
        email: userData.email,
      })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'email already exists',
      error: 'Bad Request',
    });
  });
});
