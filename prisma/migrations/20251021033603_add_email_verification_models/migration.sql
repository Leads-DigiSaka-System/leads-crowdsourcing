-- CreateTable
CREATE TABLE "public"."email_verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verification_sessions" (
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_sessions_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_email_idx" ON "public"."email_verification_codes"("email");

-- CreateIndex
CREATE INDEX "email_verification_sessions_email_idx" ON "public"."email_verification_sessions"("email");
