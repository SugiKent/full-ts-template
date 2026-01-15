-- CreateTable
CREATE TABLE "StepSuggestion" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StepSuggestion_itemId_idx" ON "StepSuggestion"("itemId");

-- AddForeignKey
ALTER TABLE "StepSuggestion" ADD CONSTRAINT "StepSuggestion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "WishlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
