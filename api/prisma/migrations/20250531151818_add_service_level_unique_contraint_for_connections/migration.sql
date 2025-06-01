/*
  Warnings:

  - A unique constraint covering the columns `[service,serviceId]` on the table `Connection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Connection_service_serviceId_key" ON "Connection"("service", "serviceId");
