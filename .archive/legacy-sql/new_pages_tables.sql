-- ============================================
-- ComplyEasyAI - New Pages Database Migration
-- For: Signup, Learn, Community, Status Pages
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: SIGNUP PAGE ENHANCEMENTS
-- Add fields to existing Organization table
-- ============================================

ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "industry" TEXT,
ADD COLUMN IF NOT EXISTS "companySize" TEXT,
ADD COLUMN IF NOT EXISTS "primaryComplianceGoal" TEXT,
ADD COLUMN IF NOT EXISTS "howDidYouHear" TEXT,
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER DEFAULT 0;

-- Email verification tokens (separate from MagicLink for signup flow)
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verified" BOOLEAN DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

-- ============================================
-- PART 2: LEARN PAGE TABLES
-- Courses, Tutorials, Webinars, Certifications
-- ============================================

-- Course Categories
CREATE TYPE "CourseLevel" AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TYPE "ContentType" AS ENUM (
  'video',
  'article',
  'interactive',
  'quiz',
  'webinar',
  'hands_on_lab'
);

CREATE TYPE "EnrollmentStatus" AS ENUM (
  'enrolled',
  'in_progress',
  'completed',
  'dropped'
);

-- Courses Table
CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "shortDescription" TEXT,
  "thumbnailUrl" TEXT,
  "category" TEXT NOT NULL, -- SOC2, ISO27001, GDPR, EU_AI_Act, HIPAA, aCOS, General
  "level" "CourseLevel" NOT NULL DEFAULT 'beginner',
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "lessonCount" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN DEFAULT false,
  "isFree" BOOLEAN DEFAULT false,
  "price" DECIMAL(10,2),
  "requiredTier" TEXT DEFAULT 'Foundation', -- Minimum tier required
  "instructor" TEXT,
  "instructorAvatar" TEXT,
  "syllabus" JSONB, -- Array of module/lesson outlines
  "learningObjectives" TEXT[],
  "prerequisites" TEXT[],
  "tags" TEXT[],
  "rating" DECIMAL(2,1) DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "enrollmentCount" INTEGER DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "isPublished" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Course_category_idx" ON "Course"("category");
CREATE INDEX IF NOT EXISTS "Course_level_idx" ON "Course"("level");
CREATE INDEX IF NOT EXISTS "Course_isFeatured_idx" ON "Course"("isFeatured");
CREATE INDEX IF NOT EXISTS "Course_isPublished_idx" ON "Course"("isPublished");
CREATE INDEX IF NOT EXISTS "Course_slug_idx" ON "Course"("slug");

-- Course Lessons/Modules
CREATE TABLE IF NOT EXISTS "CourseLesson" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "contentType" "ContentType" NOT NULL DEFAULT 'video',
  "contentUrl" TEXT, -- Video URL, article content, etc.
  "content" TEXT, -- For article type
  "durationMinutes" INTEGER DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "moduleNumber" INTEGER DEFAULT 1,
  "lessonNumber" INTEGER DEFAULT 1,
  "isFreePreview" BOOLEAN DEFAULT false,
  "resources" JSONB, -- Downloadable resources
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CourseLesson_courseId_idx" ON "CourseLesson"("courseId");
CREATE INDEX IF NOT EXISTS "CourseLesson_sortOrder_idx" ON "CourseLesson"("sortOrder");

-- Course Enrollments (User Progress)
CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "status" "EnrollmentStatus" NOT NULL DEFAULT 'enrolled',
  "progress" INTEGER DEFAULT 0, -- 0-100 percentage
  "completedLessons" TEXT[] DEFAULT '{}', -- Array of completed lesson IDs
  "currentLessonId" TEXT,
  "lastAccessedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "certificateIssued" BOOLEAN DEFAULT false,
  "certificateUrl" TEXT,
  "rating" INTEGER, -- User's rating 1-5
  "review" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "courseId")
);

CREATE INDEX IF NOT EXISTS "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");

-- Tutorials (Standalone articles/videos)
CREATE TABLE IF NOT EXISTS "Tutorial" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL, -- Markdown content
  "thumbnailUrl" TEXT,
  "contentType" "ContentType" NOT NULL DEFAULT 'article',
  "videoUrl" TEXT,
  "category" TEXT NOT NULL,
  "tags" TEXT[],
  "authorId" TEXT,
  "authorName" TEXT,
  "readTimeMinutes" INTEGER DEFAULT 5,
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Tutorial_category_idx" ON "Tutorial"("category");
CREATE INDEX IF NOT EXISTS "Tutorial_isPublished_idx" ON "Tutorial"("isPublished");
CREATE INDEX IF NOT EXISTS "Tutorial_slug_idx" ON "Tutorial"("slug");

-- Webinars
CREATE TYPE "WebinarStatus" AS ENUM (
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS "Webinar" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "category" TEXT NOT NULL,
  "hostName" TEXT NOT NULL,
  "hostTitle" TEXT,
  "hostAvatar" TEXT,
  "guestSpeakers" JSONB, -- Array of guest speaker info
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER DEFAULT 60,
  "timezone" TEXT DEFAULT 'UTC',
  "status" "WebinarStatus" NOT NULL DEFAULT 'scheduled',
  "registrationUrl" TEXT,
  "meetingUrl" TEXT, -- Zoom/Teams link (hidden until registered)
  "recordingUrl" TEXT, -- Available after completion
  "maxAttendees" INTEGER,
  "registrationCount" INTEGER DEFAULT 0,
  "attendeeCount" INTEGER DEFAULT 0,
  "isPublished" BOOLEAN DEFAULT false,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Webinar_scheduledAt_idx" ON "Webinar"("scheduledAt");
CREATE INDEX IF NOT EXISTS "Webinar_status_idx" ON "Webinar"("status");
CREATE INDEX IF NOT EXISTS "Webinar_category_idx" ON "Webinar"("category");
CREATE INDEX IF NOT EXISTS "Webinar_slug_idx" ON "Webinar"("slug");

-- Webinar Registrations
CREATE TABLE IF NOT EXISTS "WebinarRegistration" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "webinarId" TEXT NOT NULL REFERENCES "Webinar"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "jobTitle" TEXT,
  "attended" BOOLEAN DEFAULT false,
  "joinedAt" TIMESTAMP(3),
  "leftAt" TIMESTAMP(3),
  "watchDurationMinutes" INTEGER,
  "reminderSent" BOOLEAN DEFAULT false,
  "feedbackRating" INTEGER,
  "feedbackComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("webinarId", "email")
);

CREATE INDEX IF NOT EXISTS "WebinarRegistration_webinarId_idx" ON "WebinarRegistration"("webinarId");
CREATE INDEX IF NOT EXISTS "WebinarRegistration_userId_idx" ON "WebinarRegistration"("userId");
CREATE INDEX IF NOT EXISTS "WebinarRegistration_email_idx" ON "WebinarRegistration"("email");

-- Certification Programs
CREATE TABLE IF NOT EXISTS "CertificationProgram" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "shortDescription" TEXT,
  "thumbnailUrl" TEXT,
  "badgeUrl" TEXT,
  "category" TEXT NOT NULL,
  "level" "CourseLevel" NOT NULL DEFAULT 'intermediate',
  "requiredCourses" TEXT[], -- Course IDs required
  "requiredScore" INTEGER DEFAULT 70, -- Minimum passing score
  "examDurationMinutes" INTEGER DEFAULT 90,
  "examQuestionCount" INTEGER DEFAULT 50,
  "price" DECIMAL(10,2),
  "isFree" BOOLEAN DEFAULT false,
  "validityMonths" INTEGER DEFAULT 24, -- Certification validity
  "renewalRequired" BOOLEAN DEFAULT true,
  "isPublished" BOOLEAN DEFAULT false,
  "enrollmentCount" INTEGER DEFAULT 0,
  "passRate" DECIMAL(4,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CertificationProgram_category_idx" ON "CertificationProgram"("category");
CREATE INDEX IF NOT EXISTS "CertificationProgram_isPublished_idx" ON "CertificationProgram"("isPublished");
CREATE INDEX IF NOT EXISTS "CertificationProgram_slug_idx" ON "CertificationProgram"("slug");

-- User Certifications
CREATE TYPE "CertificationStatus" AS ENUM (
  'in_progress',
  'exam_scheduled',
  'passed',
  'failed',
  'expired',
  'revoked'
);

CREATE TABLE IF NOT EXISTS "UserCertification" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "certificationId" TEXT NOT NULL REFERENCES "CertificationProgram"("id") ON DELETE CASCADE,
  "status" "CertificationStatus" NOT NULL DEFAULT 'in_progress',
  "examAttempts" INTEGER DEFAULT 0,
  "lastExamDate" TIMESTAMP(3),
  "lastExamScore" INTEGER,
  "passedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "certificateNumber" TEXT UNIQUE,
  "certificateUrl" TEXT,
  "badgeUrl" TEXT,
  "verificationUrl" TEXT, -- Public verification link
  "linkedInAdded" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "certificationId")
);

CREATE INDEX IF NOT EXISTS "UserCertification_userId_idx" ON "UserCertification"("userId");
CREATE INDEX IF NOT EXISTS "UserCertification_certificationId_idx" ON "UserCertification"("certificationId");
CREATE INDEX IF NOT EXISTS "UserCertification_status_idx" ON "UserCertification"("status");
CREATE INDEX IF NOT EXISTS "UserCertification_certificateNumber_idx" ON "UserCertification"("certificateNumber");

-- ============================================
-- PART 3: COMMUNITY PAGE TABLES
-- Forum, Events, Resources, Contributors
-- ============================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS "ForumCategory" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  "postCount" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ForumCategory_slug_idx" ON "ForumCategory"("slug");
CREATE INDEX IF NOT EXISTS "ForumCategory_isActive_idx" ON "ForumCategory"("isActive");

-- Forum Posts/Threads
CREATE TYPE "ForumPostStatus" AS ENUM (
  'published',
  'draft',
  'hidden',
  'deleted',
  'locked'
);

CREATE TABLE IF NOT EXISTS "ForumPost" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "categoryId" TEXT NOT NULL REFERENCES "ForumCategory"("id") ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT NOT NULL, -- Markdown
  "status" "ForumPostStatus" NOT NULL DEFAULT 'published',
  "isPinned" BOOLEAN DEFAULT false,
  "isSolved" BOOLEAN DEFAULT false,
  "solvedCommentId" TEXT,
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "commentCount" INTEGER DEFAULT 0,
  "tags" TEXT[],
  "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("categoryId", "slug")
);

CREATE INDEX IF NOT EXISTS "ForumPost_categoryId_idx" ON "ForumPost"("categoryId");
CREATE INDEX IF NOT EXISTS "ForumPost_authorId_idx" ON "ForumPost"("authorId");
CREATE INDEX IF NOT EXISTS "ForumPost_status_idx" ON "ForumPost"("status");
CREATE INDEX IF NOT EXISTS "ForumPost_isPinned_idx" ON "ForumPost"("isPinned");
CREATE INDEX IF NOT EXISTS "ForumPost_isSolved_idx" ON "ForumPost"("isSolved");
CREATE INDEX IF NOT EXISTS "ForumPost_lastActivityAt_idx" ON "ForumPost"("lastActivityAt");
CREATE INDEX IF NOT EXISTS "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");

-- Forum Comments/Replies
CREATE TABLE IF NOT EXISTS "ForumComment" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "postId" TEXT NOT NULL REFERENCES "ForumPost"("id") ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "parentCommentId" TEXT REFERENCES "ForumComment"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "isAcceptedAnswer" BOOLEAN DEFAULT false,
  "likeCount" INTEGER DEFAULT 0,
  "isEdited" BOOLEAN DEFAULT false,
  "isHidden" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ForumComment_postId_idx" ON "ForumComment"("postId");
CREATE INDEX IF NOT EXISTS "ForumComment_authorId_idx" ON "ForumComment"("authorId");
CREATE INDEX IF NOT EXISTS "ForumComment_parentCommentId_idx" ON "ForumComment"("parentCommentId");
CREATE INDEX IF NOT EXISTS "ForumComment_isAcceptedAnswer_idx" ON "ForumComment"("isAcceptedAnswer");

-- Forum Votes (for posts and comments)
CREATE TABLE IF NOT EXISTS "ForumVote" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "postId" TEXT REFERENCES "ForumPost"("id") ON DELETE CASCADE,
  "commentId" TEXT REFERENCES "ForumComment"("id") ON DELETE CASCADE,
  "voteType" INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vote_target_check" CHECK (
    ("postId" IS NOT NULL AND "commentId" IS NULL) OR
    ("postId" IS NULL AND "commentId" IS NOT NULL)
  ),
  UNIQUE("userId", "postId"),
  UNIQUE("userId", "commentId")
);

CREATE INDEX IF NOT EXISTS "ForumVote_userId_idx" ON "ForumVote"("userId");
CREATE INDEX IF NOT EXISTS "ForumVote_postId_idx" ON "ForumVote"("postId");
CREATE INDEX IF NOT EXISTS "ForumVote_commentId_idx" ON "ForumVote"("commentId");

-- Community Events (Conferences, Workshops, Meetups, Hackathons)
CREATE TYPE "CommunityEventType" AS ENUM (
  'conference',
  'workshop',
  'meetup',
  'hackathon',
  'webinar',
  'ama',
  'other'
);

CREATE TYPE "CommunityEventStatus" AS ENUM (
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS "CommunityEvent" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "shortDescription" TEXT,
  "thumbnailUrl" TEXT,
  "eventType" "CommunityEventType" NOT NULL,
  "status" "CommunityEventStatus" NOT NULL DEFAULT 'draft',
  "isVirtual" BOOLEAN DEFAULT false,
  "location" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "virtualUrl" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT DEFAULT 'UTC',
  "maxAttendees" INTEGER,
  "registrationCount" INTEGER DEFAULT 0,
  "attendeeCount" INTEGER DEFAULT 0,
  "price" DECIMAL(10,2) DEFAULT 0,
  "currency" TEXT DEFAULT 'USD',
  "isFree" BOOLEAN DEFAULT true,
  "registrationDeadline" TIMESTAMP(3),
  "organizerName" TEXT,
  "organizerEmail" TEXT,
  "speakers" JSONB, -- Array of speaker info
  "agenda" JSONB, -- Event schedule
  "sponsors" JSONB,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CommunityEvent_eventType_idx" ON "CommunityEvent"("eventType");
CREATE INDEX IF NOT EXISTS "CommunityEvent_status_idx" ON "CommunityEvent"("status");
CREATE INDEX IF NOT EXISTS "CommunityEvent_startDate_idx" ON "CommunityEvent"("startDate");
CREATE INDEX IF NOT EXISTS "CommunityEvent_slug_idx" ON "CommunityEvent"("slug");

-- Event Registrations
CREATE TABLE IF NOT EXISTS "EventRegistration" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "eventId" TEXT NOT NULL REFERENCES "CommunityEvent"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "jobTitle" TEXT,
  "dietaryRestrictions" TEXT,
  "specialRequirements" TEXT,
  "ticketType" TEXT DEFAULT 'general',
  "attended" BOOLEAN DEFAULT false,
  "checkedInAt" TIMESTAMP(3),
  "confirmationSent" BOOLEAN DEFAULT false,
  "reminderSent" BOOLEAN DEFAULT false,
  "feedbackSubmitted" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("eventId", "email")
);

CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX IF NOT EXISTS "EventRegistration_userId_idx" ON "EventRegistration"("userId");
CREATE INDEX IF NOT EXISTS "EventRegistration_email_idx" ON "EventRegistration"("email");

-- Shared Resources (Templates, Integrations, Plugins)
CREATE TYPE "ResourceType" AS ENUM (
  'template',
  'integration',
  'plugin',
  'script',
  'guide',
  'checklist',
  'policy',
  'other'
);

CREATE TABLE IF NOT EXISTS "SharedResource" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "resourceType" "ResourceType" NOT NULL,
  "category" TEXT, -- SOC2, ISO27001, GDPR, etc.
  "thumbnailUrl" TEXT,
  "fileUrl" TEXT,
  "fileSize" INTEGER,
  "fileName" TEXT,
  "externalUrl" TEXT, -- For integrations/plugins
  "sourceCodeUrl" TEXT, -- GitHub link
  "version" TEXT,
  "compatibility" TEXT[], -- Compatible frameworks/tools
  "downloadCount" INTEGER DEFAULT 0,
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "rating" DECIMAL(2,1) DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "isFeatured" BOOLEAN DEFAULT false,
  "isVerified" BOOLEAN DEFAULT false, -- Verified by ComplyEasyAI team
  "isPublished" BOOLEAN DEFAULT false,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SharedResource_authorId_idx" ON "SharedResource"("authorId");
CREATE INDEX IF NOT EXISTS "SharedResource_resourceType_idx" ON "SharedResource"("resourceType");
CREATE INDEX IF NOT EXISTS "SharedResource_category_idx" ON "SharedResource"("category");
CREATE INDEX IF NOT EXISTS "SharedResource_isFeatured_idx" ON "SharedResource"("isFeatured");
CREATE INDEX IF NOT EXISTS "SharedResource_isPublished_idx" ON "SharedResource"("isPublished");
CREATE INDEX IF NOT EXISTS "SharedResource_slug_idx" ON "SharedResource"("slug");

-- Resource Downloads
CREATE TABLE IF NOT EXISTS "ResourceDownload" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "resourceId" TEXT NOT NULL REFERENCES "SharedResource"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ResourceDownload_resourceId_idx" ON "ResourceDownload"("resourceId");
CREATE INDEX IF NOT EXISTS "ResourceDownload_userId_idx" ON "ResourceDownload"("userId");
CREATE INDEX IF NOT EXISTS "ResourceDownload_createdAt_idx" ON "ResourceDownload"("createdAt");

-- User Contributions (Leaderboard/Points)
CREATE TABLE IF NOT EXISTS "UserContribution" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "totalPoints" INTEGER DEFAULT 0,
  "forumPosts" INTEGER DEFAULT 0,
  "forumComments" INTEGER DEFAULT 0,
  "acceptedAnswers" INTEGER DEFAULT 0,
  "resourcesShared" INTEGER DEFAULT 0,
  "eventsAttended" INTEGER DEFAULT 0,
  "helpfulVotes" INTEGER DEFAULT 0,
  "badgeCount" INTEGER DEFAULT 0,
  "badges" JSONB DEFAULT '[]', -- Array of earned badges
  "rank" TEXT DEFAULT 'newcomer', -- newcomer, contributor, expert, champion, legend
  "streak" INTEGER DEFAULT 0, -- Days of consecutive activity
  "lastActivityAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS "UserContribution_userId_idx" ON "UserContribution"("userId");
CREATE INDEX IF NOT EXISTS "UserContribution_totalPoints_idx" ON "UserContribution"("totalPoints" DESC);
CREATE INDEX IF NOT EXISTS "UserContribution_rank_idx" ON "UserContribution"("rank");

-- Contribution Activities (Point history)
CREATE TABLE IF NOT EXISTS "ContributionActivity" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "activityType" TEXT NOT NULL, -- post_created, comment_added, answer_accepted, resource_shared, etc.
  "points" INTEGER NOT NULL,
  "referenceId" TEXT, -- ID of the post/comment/resource
  "referenceType" TEXT, -- post, comment, resource, event
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ContributionActivity_userId_idx" ON "ContributionActivity"("userId");
CREATE INDEX IF NOT EXISTS "ContributionActivity_activityType_idx" ON "ContributionActivity"("activityType");
CREATE INDEX IF NOT EXISTS "ContributionActivity_createdAt_idx" ON "ContributionActivity"("createdAt");

-- ============================================
-- PART 4: STATUS PAGE TABLES
-- Services, Incidents, Maintenance
-- ============================================

-- Service Status
CREATE TYPE "ServiceStatusType" AS ENUM (
  'operational',
  'degraded_performance',
  'partial_outage',
  'major_outage',
  'maintenance'
);

CREATE TABLE IF NOT EXISTS "ServiceStatus" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "category" TEXT, -- Core, AI, Integration, API, etc.
  "status" "ServiceStatusType" NOT NULL DEFAULT 'operational',
  "uptimePercent" DECIMAL(5,2) DEFAULT 100.00,
  "lastIncidentAt" TIMESTAMP(3),
  "isPublic" BOOLEAN DEFAULT true,
  "sortOrder" INTEGER DEFAULT 0,
  "healthCheckUrl" TEXT,
  "lastHealthCheck" TIMESTAMP(3),
  "responseTimeMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ServiceStatus_status_idx" ON "ServiceStatus"("status");
CREATE INDEX IF NOT EXISTS "ServiceStatus_category_idx" ON "ServiceStatus"("category");
CREATE INDEX IF NOT EXISTS "ServiceStatus_isPublic_idx" ON "ServiceStatus"("isPublic");
CREATE INDEX IF NOT EXISTS "ServiceStatus_slug_idx" ON "ServiceStatus"("slug");

-- Status History (90-day history)
CREATE TABLE IF NOT EXISTS "StatusHistory" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "serviceId" TEXT NOT NULL REFERENCES "ServiceStatus"("id") ON DELETE CASCADE,
  "status" "ServiceStatusType" NOT NULL,
  "uptimePercent" DECIMAL(5,2),
  "responseTimeMs" INTEGER,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("serviceId", "date")
);

CREATE INDEX IF NOT EXISTS "StatusHistory_serviceId_idx" ON "StatusHistory"("serviceId");
CREATE INDEX IF NOT EXISTS "StatusHistory_date_idx" ON "StatusHistory"("date");

-- Incidents
CREATE TYPE "IncidentSeverity" AS ENUM (
  'minor',
  'major',
  'critical'
);

CREATE TYPE "IncidentStatus" AS ENUM (
  'investigating',
  'identified',
  'monitoring',
  'resolved',
  'postmortem'
);

CREATE TABLE IF NOT EXISTS "Incident" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "severity" "IncidentSeverity" NOT NULL DEFAULT 'minor',
  "status" "IncidentStatus" NOT NULL DEFAULT 'investigating',
  "description" TEXT,
  "affectedServices" TEXT[], -- Service IDs
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "identifiedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "postmortemUrl" TEXT,
  "postmortemPublished" BOOLEAN DEFAULT false,
  "isPublic" BOOLEAN DEFAULT true,
  "notificationsSent" BOOLEAN DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Incident_severity_idx" ON "Incident"("severity");
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");
CREATE INDEX IF NOT EXISTS "Incident_startedAt_idx" ON "Incident"("startedAt");
CREATE INDEX IF NOT EXISTS "Incident_isPublic_idx" ON "Incident"("isPublic");
CREATE INDEX IF NOT EXISTS "Incident_slug_idx" ON "Incident"("slug");

-- Incident Updates (Timeline)
CREATE TABLE IF NOT EXISTS "IncidentUpdate" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "incidentId" TEXT NOT NULL REFERENCES "Incident"("id") ON DELETE CASCADE,
  "status" "IncidentStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "isInternal" BOOLEAN DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IncidentUpdate_incidentId_idx" ON "IncidentUpdate"("incidentId");
CREATE INDEX IF NOT EXISTS "IncidentUpdate_createdAt_idx" ON "IncidentUpdate"("createdAt");

-- Scheduled Maintenance
CREATE TYPE "MaintenanceStatus" AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS "MaintenanceWindow" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "affectedServices" TEXT[], -- Service IDs
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'scheduled',
  "scheduledStart" TIMESTAMP(3) NOT NULL,
  "scheduledEnd" TIMESTAMP(3) NOT NULL,
  "actualStart" TIMESTAMP(3),
  "actualEnd" TIMESTAMP(3),
  "impact" TEXT, -- Expected impact description
  "notificationsSent" BOOLEAN DEFAULT false,
  "reminderSent" BOOLEAN DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "MaintenanceWindow_status_idx" ON "MaintenanceWindow"("status");
CREATE INDEX IF NOT EXISTS "MaintenanceWindow_scheduledStart_idx" ON "MaintenanceWindow"("scheduledStart");

-- Status Subscriptions (Subscribe to updates)
CREATE TABLE IF NOT EXISTS "StatusSubscription" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  "email" TEXT NOT NULL,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "services" TEXT[] DEFAULT '{}', -- Empty means all services
  "notifyIncidents" BOOLEAN DEFAULT true,
  "notifyMaintenance" BOOLEAN DEFAULT true,
  "notifyResolutions" BOOLEAN DEFAULT true,
  "isVerified" BOOLEAN DEFAULT false,
  "verificationToken" TEXT,
  "unsubscribeToken" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("email")
);

CREATE INDEX IF NOT EXISTS "StatusSubscription_email_idx" ON "StatusSubscription"("email");
CREATE INDEX IF NOT EXISTS "StatusSubscription_userId_idx" ON "StatusSubscription"("userId");
CREATE INDEX IF NOT EXISTS "StatusSubscription_isVerified_idx" ON "StatusSubscription"("isVerified");

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Apply update trigger to new tables
CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON "Course"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lesson_updated_at BEFORE UPDATE ON "CourseLesson"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollment_updated_at BEFORE UPDATE ON "CourseEnrollment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_updated_at BEFORE UPDATE ON "Tutorial"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webinar_updated_at BEFORE UPDATE ON "Webinar"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certification_program_updated_at BEFORE UPDATE ON "CertificationProgram"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_certification_updated_at BEFORE UPDATE ON "UserCertification"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_category_updated_at BEFORE UPDATE ON "ForumCategory"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_post_updated_at BEFORE UPDATE ON "ForumPost"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_comment_updated_at BEFORE UPDATE ON "ForumComment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_event_updated_at BEFORE UPDATE ON "CommunityEvent"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_resource_updated_at BEFORE UPDATE ON "SharedResource"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contribution_updated_at BEFORE UPDATE ON "UserContribution"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_status_updated_at BEFORE UPDATE ON "ServiceStatus"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_updated_at BEFORE UPDATE ON "Incident"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_window_updated_at BEFORE UPDATE ON "MaintenanceWindow"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA FOR STATUS PAGE SERVICES
-- ============================================

INSERT INTO "ServiceStatus" ("name", "slug", "description", "category", "status", "sortOrder") VALUES
('Web Application', 'web-app', 'Main ComplyEasyAI web application', 'Core', 'operational', 1),
('API Gateway', 'api-gateway', 'REST API endpoints', 'Core', 'operational', 2),
('Authentication', 'auth', 'Login, SSO, and session management', 'Core', 'operational', 3),
('Database', 'database', 'Primary PostgreSQL database', 'Core', 'operational', 4),
('AI Policy Generator', 'ai-policy', 'AI-powered policy generation service', 'AI', 'operational', 5),
('AI Contract Analyzer', 'ai-contract', 'Contract analysis and risk detection', 'AI', 'operational', 6),
('AI Gap Analysis', 'ai-gap', 'Compliance gap analysis service', 'AI', 'operational', 7),
('Integrations - AWS', 'int-aws', 'AWS cloud integration', 'Integration', 'operational', 8),
('Integrations - GitHub', 'int-github', 'GitHub integration for code reviews', 'Integration', 'operational', 9),
('Webhooks', 'webhooks', 'Webhook delivery service', 'API', 'operational', 10)
ON CONFLICT ("slug") DO NOTHING;

-- ============================================
-- SEED DATA FOR FORUM CATEGORIES
-- ============================================

INSERT INTO "ForumCategory" ("name", "slug", "description", "icon", "color", "sortOrder") VALUES
('General Discussion', 'general', 'General compliance and platform discussions', 'MessageSquare', 'blue', 1),
('SOC 2', 'soc2', 'SOC 2 Type I & II certification discussions', 'Shield', 'green', 2),
('ISO 27001', 'iso27001', 'ISO 27001 implementation and certification', 'Award', 'purple', 3),
('GDPR', 'gdpr', 'GDPR compliance and data protection', 'Lock', 'orange', 4),
('HIPAA', 'hipaa', 'Healthcare compliance and HIPAA requirements', 'Heart', 'red', 5),
('EU AI Act', 'eu-ai-act', 'EU AI Act compliance discussions', 'Brain', 'indigo', 6),
('aCOS & Automation', 'acos', 'Autonomous compliance operations', 'Zap', 'yellow', 7),
('Feature Requests', 'feature-requests', 'Suggest and vote on new features', 'Lightbulb', 'pink', 8),
('Bug Reports', 'bugs', 'Report and track platform issues', 'Bug', 'gray', 9)
ON CONFLICT ("slug") DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- New Tables Created:
--   - EmailVerificationToken
--   - Course, CourseLesson, CourseEnrollment
--   - Tutorial
--   - Webinar, WebinarRegistration
--   - CertificationProgram, UserCertification
--   - ForumCategory, ForumPost, ForumComment, ForumVote
--   - CommunityEvent, EventRegistration
--   - SharedResource, ResourceDownload
--   - UserContribution, ContributionActivity
--   - ServiceStatus, StatusHistory
--   - Incident, IncidentUpdate
--   - MaintenanceWindow
--   - StatusSubscription
--
-- New ENUMs Created:
--   - CourseLevel, ContentType, EnrollmentStatus
--   - WebinarStatus, CertificationStatus
--   - ForumPostStatus, CommunityEventType, CommunityEventStatus
--   - ResourceType
--   - ServiceStatusType, IncidentSeverity, IncidentStatus, MaintenanceStatus
-- ============================================
