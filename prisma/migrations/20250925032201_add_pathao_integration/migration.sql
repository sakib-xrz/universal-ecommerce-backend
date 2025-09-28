-- CreateTable
CREATE TABLE "public"."pathao_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "consignment_id" TEXT,
    "merchant_order_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "delivery_type" INTEGER NOT NULL DEFAULT 48,
    "item_type" INTEGER NOT NULL DEFAULT 2,
    "special_instruction" TEXT,
    "item_quantity" INTEGER NOT NULL DEFAULT 1,
    "item_weight" TEXT NOT NULL DEFAULT '0.5',
    "item_description" TEXT,
    "amount_to_collect" INTEGER NOT NULL DEFAULT 0,
    "delivery_fee" DOUBLE PRECISION,
    "order_status" TEXT,
    "pathao_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pathao_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pathao_orders_order_id_key" ON "public"."pathao_orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "pathao_orders_consignment_id_key" ON "public"."pathao_orders"("consignment_id");

-- AddForeignKey
ALTER TABLE "public"."pathao_orders" ADD CONSTRAINT "pathao_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
