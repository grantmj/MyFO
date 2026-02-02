-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "disbursementDate" DATETIME NOT NULL,
    "startingBalance" REAL NOT NULL,
    "grants" REAL NOT NULL DEFAULT 0,
    "loans" REAL NOT NULL DEFAULT 0,
    "workStudyMonthly" REAL NOT NULL DEFAULT 0,
    "otherIncomeMonthly" REAL NOT NULL DEFAULT 0,
    "fixedCostsJson" TEXT NOT NULL,
    "variableBudgetsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "merchantGuess" TEXT,
    "source" TEXT NOT NULL DEFAULT 'csv',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FafsaChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createFsaId" BOOLEAN NOT NULL DEFAULT false,
    "gatherTaxDocs" BOOLEAN NOT NULL DEFAULT false,
    "listSchools" BOOLEAN NOT NULL DEFAULT false,
    "submitFafsa" BOOLEAN NOT NULL DEFAULT false,
    "verification" BOOLEAN NOT NULL DEFAULT false,
    "reviewAward" BOOLEAN NOT NULL DEFAULT false,
    "acceptAid" BOOLEAN NOT NULL DEFAULT false,
    "markCalendar" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FafsaChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "PlannedItem_userId_date_idx" ON "PlannedItem"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FafsaChecklist_userId_key" ON "FafsaChecklist"("userId");
