-- CreateTable
CREATE TABLE "public"."one_time_login_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_time_login_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "one_time_login_tokens_token_key" ON "public"."one_time_login_tokens"("token");

-- CreateIndex
CREATE INDEX "one_time_login_tokens_email_idx" ON "public"."one_time_login_tokens"("email");

-- CreateIndex
CREATE INDEX "one_time_login_tokens_token_idx" ON "public"."one_time_login_tokens"("token");
