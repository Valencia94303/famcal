-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "color" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CHILD',
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "recurrence" TEXT,
    "recurDays" TEXT,
    "recurTime" TEXT,
    "dueDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChoreAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choreId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "rotationOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChoreAssignment_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChoreAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "FamilyMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChoreCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choreId" TEXT NOT NULL,
    "completedById" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" DATETIME NOT NULL,
    CONSTRAINT "ChoreCompletion_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChoreCompletion_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "FamilyMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "calendarId" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GoogleAuth" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "calendarIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "displayName" TEXT NOT NULL DEFAULT 'Family Dashboard',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "showWeather" BOOLEAN NOT NULL DEFAULT true,
    "weatherLocation" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "allowedEmails" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_email_key" ON "FamilyMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreAssignment_choreId_assigneeId_key" ON "ChoreAssignment"("choreId", "assigneeId");

-- CreateIndex
CREATE INDEX "ChoreCompletion_choreId_scheduledFor_idx" ON "ChoreCompletion"("choreId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_googleId_key" ON "CalendarEvent"("googleId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");
