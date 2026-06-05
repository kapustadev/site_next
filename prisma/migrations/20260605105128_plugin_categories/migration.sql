-- AlterTable
ALTER TABLE "Plugin" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "PluginCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PluginCategory_name_key" ON "PluginCategory"("name");

-- AddForeignKey
ALTER TABLE "Plugin" ADD CONSTRAINT "Plugin_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PluginCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
