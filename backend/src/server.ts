import { buildApp } from "./app.js";

async function main() {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  try {
    // Создаем и настраиваем экземпляр Fastify, подключая плагины и маршруты из app.ts.
    app = await buildApp();

    // Определяем параметры запуска HTTP-сервера. Переменные окружения позволяют менять их без перекомпиляции.
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? "0.0.0.0";

    let closing = false;
    // Функция корректного завершения работы приложения при получении сигнала ОС (Ctrl+C или остановка контейнера).
    const shutdown = async (reason: string, err?: unknown) => {
      if (closing) return;
      closing = true;

      if (app) {
        if (err) app.log.fatal({ err }, `fatal: ${reason}`);
        else app.log.info({ reason }, "Shutting down...");

        try {
          // Fastify аккуратно завершает все активные запросы и вызывает onClose-хуки (например, отключает Prisma).
          await app.close();
        } finally {
          process.exit(err ? 1 : 0);
        }
      } else {
        console.error(`fatal before app init: ${reason}`, err);
        process.exit(1);
      }
    };
    // Подписываемся на стандартные сигналы завершения процесса и вызываем graceful shutdown.
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));

    process.once(
      "unhandledRejection",
      (reason) => void shutdown("unhandledRejection", reason)
    );
    process.once(
      "uncaughtException",
      (error) => void shutdown("uncaughtException", error)
    );

    // Запускаем HTTP-сервер. Fastify сам обработает входящие запросы и будет логировать события.
    await app.listen({ port, host });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Failed to start application:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Запуск и инициализация Node сервера
void main();
