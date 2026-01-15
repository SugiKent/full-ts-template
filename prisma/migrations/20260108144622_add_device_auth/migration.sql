-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT,
    "appVersion" TEXT,
    "hasAgreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "termsAgreedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceAccessToken" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "Device_deviceId_idx" ON "Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAccessToken_token_key" ON "DeviceAccessToken"("token");

-- CreateIndex
CREATE INDEX "DeviceAccessToken_deviceId_idx" ON "DeviceAccessToken"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceAccessToken_token_idx" ON "DeviceAccessToken"("token");

-- AddForeignKey
ALTER TABLE "DeviceAccessToken" ADD CONSTRAINT "DeviceAccessToken_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
