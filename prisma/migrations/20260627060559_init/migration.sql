-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "doctorName" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SymptomLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "painLevel" REAL NOT NULL DEFAULT 0,
    "stoolFrequency" REAL NOT NULL DEFAULT 0,
    "stoolType" REAL,
    "stressLevel" REAL NOT NULL DEFAULT 0,
    "triggers" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "medicationTaken" TEXT,
    "bloodInStool" BOOLEAN NOT NULL DEFAULT false,
    "urgencyLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SymptomLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SymptomLog_userId_idx" ON "SymptomLog"("userId");

-- CreateIndex
CREATE INDEX "SymptomLog_date_idx" ON "SymptomLog"("date");
