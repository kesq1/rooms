import Fastify, { type FastifyError } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import { STATUS_CODES } from "node:http";
import prismaPlugin from "./plugins/prisma.js";
import { Type as T } from "typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { ValidationProblem, ProblemDetails, User, Health } from "./types.js";
import {
  BookingCreateBody,
  BookingDto,
  BookingListItemDto,
} from "./types.js";



// Этот модуль собирает все настройки Fastify: плагины инфраструктуры, обработчики ошибок и маршруты API.

/**
 * Создает и настраивает экземпляр Fastify, готовый к запуску.
 */
export async function buildApp() {
  const app = Fastify({
    logger: true, // Подключаем встроенный логгер Fastify.
    trustProxy: true, // Разрешаем доверять заголовкам X-Forwarded-* от прокси/ingress.
    /**
     * Схема валидации TypeBox -> Fastify генерирует массив ошибок.
     * Мы превращаем его в ValidationProblem, чтобы вернуть клиенту единый формат Problem Details.
     */
    schemaErrorFormatter(errors, dataVar) {
      const msg =
        errors
          .map((e) => e.message)
          .filter(Boolean)
          .join("; ") || "Validation failed";
      return new ValidationProblem(msg, errors, dataVar);
    },
  }).withTypeProvider<TypeBoxTypeProvider>(); // Позволяет Fastify понимать типы TypeBox при описании схем.

  // === Инфраструктурные плагины ===

  // Helmet добавляет безопасные HTTP-заголовки (Content-Security-Policy, X-DNS-Prefetch-Control и др.).
  await app.register(helmet);

  // CORS ограничивает кросс-доменные запросы. Здесь полностью запрещаем их (origin: false) по умолчанию.
  await app.register(cors, {
    origin: true,
  });

  /**
   * Ограничитель количества запросов на IP.
   * Плагин автоматически вернет 429, а мы формируем Problem Details в errorResponseBuilder.
   */
  await app.register(rateLimit, {
    max: 100, // Максимум 100 запросов
    timeWindow: "1 minute", // За одну минуту
    enableDraftSpec: true, // Добавляет стандартные RateLimit-* заголовки в ответ
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
    errorResponseBuilder(request, ctx) {
      const seconds = Math.ceil(ctx.ttl / 1000);
      return {
        type: "about:blank",
        title: "Too Many Requests",
        status: 429,
        detail: `Rate limit exceeded. Retry in ${seconds} seconds.`,
        instance: request.url,
      } satisfies ProblemDetails;
    },
  });

  /**
   * Документация API в формате OpenAPI 3.0.
   */
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Rooms API",
        version: "1.0.0",
        description: "HTTP-API, совместим с RFC 9457.",
      },
      servers: [{ url: "http://localhost:3000" }],
      tags: [
        {
          name: "Users",
          description: "Маршруты для управления пользователями",
        },
        { name: "System", description: "Служебные эндпоинты" },
      ],
    },
  });

  // Плагин с PrismaClient: открывает соединение с БД и добавляет app.prisma во все маршруты.
  await app.register(prismaPlugin);

  // === Глобальные обработчики ошибок ===

  /**
   * Единая точка обработки ошибок. Мы приводим их к Problem Details и отправляем клиенту JSON.
   * ValidationProblem превращается в 400, остальные ошибки хранят свой статус или получают 500.
   */
  app.setErrorHandler<FastifyError | ValidationProblem>((err, req, reply) => {
    const status = typeof err.statusCode === "number" ? err.statusCode : 500;
    const isValidation = err instanceof ValidationProblem;

    const problem = {
      type: "about:blank",
      title: STATUS_CODES[status] ?? "Error",
      status,
      detail: err.message || "Unexpected error",
      instance: req.url,
      ...(isValidation ? { errorsText: err.message } : {}),
    };

    reply.code(status).type("application/problem+json").send(problem);
  });

  // Отдельный обработчик 404: отвечает в формате Problem Details.
  app.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .type("application/problem+json")
      .send({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: `Route ${request.method} ${request.url} not found`,
        instance: request.url,
      } satisfies ProblemDetails);
  });

  // === Маршруты API ===

  /**
   * GET /api/users — примеры чтения данных из базы через Prisma.
   */
  app.get(
    "/api/users",
    {
      schema: {
        operationId: "listUsers",
        tags: ["Users"],
        summary: "Возвращает список пользователей",
        description: "Получаем id и email для каждого пользователя.",
        response: {
          200: {
            description: "Список пользователей",
            content: { "application/json": { schema: T.Array(User) } },
          },
          429: {
            description: "Too Many Requests",
            headers: {
              "retry-after": {
                schema: T.Integer({
                  minimum: 0,
                  description: "Через сколько секунд можно повторить запрос",
                }),
              },
            },
            content: { "application/problem+json": { schema: ProblemDetails } },
          },
          500: {
            description: "Internal Server Error",
            content: { "application/problem+json": { schema: ProblemDetails } },
          },
        },
      },
    },
    async (_req, _reply) => {
      // Prisma автоматически превращает результат в Promise; Fastify вернет массив как JSON.
      return app.prisma.user.findMany({ select: { id: true, email: true } });
    }
  );

  /**
   * GET /api/health — health-check для мониторинга.
   * Пытаемся сделать минимальный запрос в БД. Если БД недоступна, возвращаем 503.
   */
  app.get(
    "/api/health",
    {
      schema: {
        operationId: "health",
        tags: ["System"],
        summary: "Health/Readiness",
        description: "Проверяет, что процесс жив и база данных отвечает.",
        response: {
          200: {
            description: "Ready",
            content: { "application/json": { schema: Health } },
          },
          503: {
            description: "Temporarily unavailable",
            content: { "application/problem+json": { schema: ProblemDetails } },
          },
          429: {
            description: "Too Many Requests",
            headers: {
              "retry-after": { schema: T.Integer({ minimum: 0 }) },
            },
            content: { "application/problem+json": { schema: ProblemDetails } },
          },
          500: {
            description: "Internal Server Error",
            content: { "application/problem+json": { schema: ProblemDetails } },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        // Если SELECT 1 прошел — сервис готов.
        await app.prisma.$queryRaw`SELECT 1`;
        return { ok: true } as Health;
      } catch {
        // Возвращаем 503, чтобы условный балансировщик мог вывести инстанс из ротации.
        reply
          .code(503)
          .type("application/problem+json")
          .send({
            type: "https://example.com/problems/dependency-unavailable",
            title: "Service Unavailable",
            status: 503,
            detail: "Database ping failed",
            instance: "/api/health",
          } satisfies ProblemDetails);
      }
    }
  );

  // Служебный маршрут: возвращает OpenAPI-спецификацию.
  app.get(
    "/openapi.json",
    {
      schema: { hide: true, tags: ["Internal"] }, // Скрыт из списка, но доступен для клиентов/тестов
    },
    async (_req, reply) => {
      reply.type("application/json").send(app.swagger());
    }
  );


  app.get(
    "/api/bookings",
    {
      schema: {
        tags: ["System"],
        summary: "Список бронирований",
        response: {
          200: T.Array(BookingListItemDto),
          500: ProblemDetails,
        },
      },
    },
    async () => {
      const items = await app.prisma.booking.findMany({
        orderBy: { startAt: "desc" },
        include: {
          room: { select: { number: true, name: true } },
          backupRoom: { select: { number: true, name: true } },
        },
      });

      return items.map((x) => ({
        id: x.id,
        eventName: x.eventName,
        eventType: x.eventType as any,
        subject: x.subject ?? null,
        startsAt: x.startAt.toISOString(),
        endsAt: x.endAt.toISOString(),
        roomId: x.roomId,
        roomLabel: `${x.room.number} — ${x.room.name}`,
        backupRoomId: x.backupRoomId ?? null,
        backupRoomLabel: x.backupRoom
          ? `${x.backupRoom.number} — ${x.backupRoom.name}`
          : null,
        organizerName: x.organizerName,
        createdAt: x.createdAt.toISOString(),
      }));
    }
  );

  app.post("/api/bookings", async (req, reply) => {
    const b = req.body as {
      eventName: string;
      eventType: string;
      subject?: string;
      organizerName: string;
      roomId: string;
      backupRoomId?: string;
      startsAt: string;
      endsAt: string;
    };

    if (
      !b.eventName?.trim() ||
      !b.eventType ||
      !b.organizerName?.trim() ||
      !b.roomId ||
      !b.startsAt ||
      !b.endsAt
    ) {
      return reply.code(400).send({ message: "Invalid booking data" });
    }

    const startsAt = new Date(b.startsAt);
    const endsAt = new Date(b.endsAt);

    if (
      isNaN(startsAt.getTime()) ||
      isNaN(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      return reply.code(400).send({ message: "Invalid time range" });
    }

    if (b.backupRoomId && b.backupRoomId === b.roomId) {
      return reply.code(400).send({ message: "Backup room must be different" });
    }

    // защита от пересечений
    const overlap = await app.prisma.booking.findFirst({
      where: {
        roomId: b.roomId,
        AND: [{ startAt: { lt: endsAt } }, { endAt: { gt: startsAt } }],
      },
      select: { id: true },
    });

    if (overlap) {
      return reply
        .code(409)
        .send({ message: "Room already booked for this time" });
    }

    const booking = await app.prisma.booking.create({
      data: {
        eventName: b.eventName.trim(),
        eventType: b.eventType as any,
        subject: b.subject?.trim() || null,
        organizerName: b.organizerName.trim(),
        roomId: b.roomId,
        backupRoomId: b.backupRoomId || null,
        startAt: startsAt,
        endAt: endsAt,
      },
    });

    return reply.code(201).send({
      id: booking.id,
      eventName: booking.eventName,
      eventType: booking.eventType,
      subject: booking.subject,
      organizerName: booking.organizerName,
      roomId: booking.roomId,
      backupRoomId: booking.backupRoomId,
      startsAt: booking.startAt.toISOString(),
      endsAt: booking.endAt.toISOString(),
      createdAt: booking.createdAt.toISOString(),
    });
  });

  app.get(
    "/api/rooms",
    {
      schema: {
        tags: ["System"],
        summary: "Список аудиторий",
        response: {
          200: T.Array(
            T.Object({
              id: T.String(),
              number: T.String(),
              name: T.String(),
              capacity: T.Integer(),
              description: T.Union([T.String(), T.Null()]),
              createdAt: T.String({ format: "date-time" }),
              updatedAt: T.String({ format: "date-time" }),
            })
          ),
          500: ProblemDetails,
        },
      },
    },
    async () => {
      const rooms = await app.prisma.room.findMany({
        orderBy: { number: "asc" },
      });

      return rooms.map((r) => ({
        id: r.id,
        number: r.number,
        name: r.name,
        capacity: r.capacity,
        description: r.description ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }
  );

  app.post("/api/rooms", async (req, reply) => {
    const body = req.body as {
      number: string;
      name: string;
      capacity: number;
      description?: string;
    };

    if (
      !body.number?.trim() ||
      !body.name?.trim() ||
      !Number.isInteger(body.capacity) ||
      body.capacity < 1
    ) {
      return reply.code(400).send({ message: "Invalid room data" });
    }

    try {
      const room = await app.prisma.room.create({
        data: {
          number: body.number.trim(),
          name: body.name.trim(),
          capacity: body.capacity,
          description: body.description?.trim() || null,
        },
      });

      return reply.code(201).send({
        id: room.id,
        number: room.number,
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        createdAt: room.createdAt.toISOString(),
      });
    } catch (e: any) {
      // unique number
      if (e?.code === "P2002") {
        return reply.code(409).send({ message: "Room already exists" });
      }
      throw e;
    }
  });

  app.put("/api/bookings/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const b = req.body as {
      eventName: string;
      eventType: string;
      subject?: string | null;
      organizerName: string;
      roomId: string;
      backupRoomId?: string | null;
      startsAt: string;
      endsAt: string;
    };

    if (
      !id ||
      !b.eventName?.trim() ||
      !b.eventType ||
      !b.organizerName?.trim() ||
      !b.roomId ||
      !b.startsAt ||
      !b.endsAt
    ) {
      return reply.code(400).send({ message: "Invalid booking data" });
    }

    const startsAt = new Date(b.startsAt);
    const endsAt = new Date(b.endsAt);
    if (
      isNaN(startsAt.getTime()) ||
      isNaN(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      return reply.code(400).send({ message: "Invalid time range" });
    }

    if (b.backupRoomId && b.backupRoomId === b.roomId) {
      return reply.code(400).send({ message: "Backup room must be different" });
    }

    // проверим, что бронь существует
    const exists = await app.prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return reply.code(404).send({ message: "Booking not found" });

    // проверка пересечений (кроме самой себя)
    const overlap = await app.prisma.booking.findFirst({
      where: {
        id: { not: id },
        roomId: b.roomId,
        AND: [{ startAt: { lt: endsAt } }, { endAt: { gt: startsAt } }],
      },
      select: { id: true },
    });

    if (overlap) {
      return reply
        .code(409)
        .send({ message: "Room already booked for this time" });
    }

    const updated = await app.prisma.booking.update({
      where: { id },
      data: {
        eventName: b.eventName.trim(),
        eventType: b.eventType as any,
        subject: b.subject?.trim?.() ? b.subject.trim() : null,
        organizerName: b.organizerName.trim(),
        roomId: b.roomId,
        backupRoomId: b.backupRoomId || null,
        startAt: startsAt,
        endAt: endsAt,
      },
    });

    return reply.send({
      id: updated.id,
      eventName: updated.eventName,
      eventType: updated.eventType,
      subject: updated.subject,
      organizerName: updated.organizerName,
      roomId: updated.roomId,
      backupRoomId: updated.backupRoomId,
      startsAt: updated.startAt.toISOString(),
      endsAt: updated.endAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    });
  });

  app.delete("/api/bookings/:id", async (req, reply) => {
    const id = (req.params as any).id as string;

    if (!id) return reply.code(400).send({ message: "Invalid id" });

    const exists = await app.prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) return reply.code(404).send({ message: "Booking not found" });

    await app.prisma.booking.delete({ where: { id } });

    return reply.code(204).send();
  });



  return app;
}
