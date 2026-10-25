ALTER TABLE "Order"
ADD COLUMN "checkoutRequestId" TEXT,
ADD COLUMN "checkoutNotes" TEXT,
ADD COLUMN "gstDetails" JSONB;

CREATE UNIQUE INDEX "Order_checkoutRequestId_key"
ON "Order"("checkoutRequestId");
