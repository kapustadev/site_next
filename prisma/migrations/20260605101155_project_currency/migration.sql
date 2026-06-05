-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetPln" DOUBLE PRECISION,
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'PLN';
