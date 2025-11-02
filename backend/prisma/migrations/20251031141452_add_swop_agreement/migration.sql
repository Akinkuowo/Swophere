-- CreateTable
CREATE TABLE "public"."swop_agreement" (
    "id" TEXT NOT NULL,
    "swop_id" TEXT NOT NULL,
    "from_user" TEXT NOT NULL,
    "to_user" TEXT NOT NULL,
    "agreement_status" TEXT NOT NULL DEFAULT 'open',
    "item_title" TEXT,
    "item_description" TEXT,
    "terms" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swop_agreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "swop_agreement_swop_id_key" ON "public"."swop_agreement"("swop_id");
