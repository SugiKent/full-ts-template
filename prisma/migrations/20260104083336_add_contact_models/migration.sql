-- CreateTable
CREATE TABLE "ContactThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactThread_userId_idx" ON "ContactThread"("userId");

-- CreateIndex
CREATE INDEX "ContactThread_status_idx" ON "ContactThread"("status");

-- CreateIndex
CREATE INDEX "ContactThread_category_idx" ON "ContactThread"("category");

-- CreateIndex
CREATE INDEX "ContactMessage_threadId_idx" ON "ContactMessage"("threadId");

-- CreateIndex
CREATE INDEX "ContactMessage_senderType_idx" ON "ContactMessage"("senderType");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");

-- AddForeignKey
ALTER TABLE "ContactThread" ADD CONSTRAINT "ContactThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ContactThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
