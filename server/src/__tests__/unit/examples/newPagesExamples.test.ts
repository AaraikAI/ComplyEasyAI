/**
 * New Pages Examples Unit Tests
 * Verifies the exports of newPagesExamples
 */

import { jest, describe, it, expect } from '@jest/globals';

// Mock external dependencies before importing
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    courseEnrollment: { create: jest.fn(), update: jest.fn() },
    webinarRegistration: { create: jest.fn() },
    webinar: { update: jest.fn() },
    userCertification: { findMany: jest.fn() },
    forumPost: { create: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    forumCategory: { update: jest.fn() },
    forumComment: { create: jest.fn(), update: jest.fn() },
    forumVote: { upsert: jest.fn() },
    sharedResource: { create: jest.fn() },
    userContribution: { upsert: jest.fn() },
    contributionActivity: { create: jest.fn() },
    serviceStatus: { update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
    statusHistory: { upsert: jest.fn(), findMany: jest.fn() },
    incident: { create: jest.fn(), update: jest.fn() },
    incidentUpdate: { create: jest.fn() },
    maintenanceWindow: { create: jest.fn() },
    statusSubscription: { create: jest.fn() },
    course: { findMany: jest.fn() },
    $use: jest.fn(),
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@prisma/client', () => ({
  EnrollmentStatus: { enrolled: 'enrolled', in_progress: 'in_progress', completed: 'completed' },
  ForumPostStatus: { published: 'published', draft: 'draft' },
  ServiceStatusType: { operational: 'operational', degraded_performance: 'degraded_performance', major_outage: 'major_outage' },
  IncidentSeverity: { critical: 'critical', major: 'major', minor: 'minor' },
}));

describe('newPagesExamples', () => {
  it('should export createCourseEnrollment as a function', async () => {
    const { createCourseEnrollment } = await import('../../../examples/newPagesExamples');
    expect(typeof createCourseEnrollment).toBe('function');
  });

  it('should export updateCourseProgress as a function', async () => {
    const { updateCourseProgress } = await import('../../../examples/newPagesExamples');
    expect(typeof updateCourseProgress).toBe('function');
  });

  it('should export registerForWebinar as a function', async () => {
    const { registerForWebinar } = await import('../../../examples/newPagesExamples');
    expect(typeof registerForWebinar).toBe('function');
  });

  it('should export getUserCertifications as a function', async () => {
    const { getUserCertifications } = await import('../../../examples/newPagesExamples');
    expect(typeof getUserCertifications).toBe('function');
  });

  it('should export createForumPost as a function', async () => {
    const { createForumPost } = await import('../../../examples/newPagesExamples');
    expect(typeof createForumPost).toBe('function');
  });

  it('should export addForumComment as a function', async () => {
    const { addForumComment } = await import('../../../examples/newPagesExamples');
    expect(typeof addForumComment).toBe('function');
  });

  it('should export voteOnForumContent as a function', async () => {
    const { voteOnForumContent } = await import('../../../examples/newPagesExamples');
    expect(typeof voteOnForumContent).toBe('function');
  });

  it('should export shareResource as a function', async () => {
    const { shareResource } = await import('../../../examples/newPagesExamples');
    expect(typeof shareResource).toBe('function');
  });

  it('should export updateUserContribution as a function', async () => {
    const { updateUserContribution } = await import('../../../examples/newPagesExamples');
    expect(typeof updateUserContribution).toBe('function');
  });

  it('should export updateServiceStatus as a function', async () => {
    const { updateServiceStatus } = await import('../../../examples/newPagesExamples');
    expect(typeof updateServiceStatus).toBe('function');
  });

  it('should export createIncident as a function', async () => {
    const { createIncident } = await import('../../../examples/newPagesExamples');
    expect(typeof createIncident).toBe('function');
  });

  it('should export addIncidentUpdate as a function', async () => {
    const { addIncidentUpdate } = await import('../../../examples/newPagesExamples');
    expect(typeof addIncidentUpdate).toBe('function');
  });

  it('should export createMaintenanceWindow as a function', async () => {
    const { createMaintenanceWindow } = await import('../../../examples/newPagesExamples');
    expect(typeof createMaintenanceWindow).toBe('function');
  });

  it('should export subscribeToStatusUpdates as a function', async () => {
    const { subscribeToStatusUpdates } = await import('../../../examples/newPagesExamples');
    expect(typeof subscribeToStatusUpdates).toBe('function');
  });

  it('should export getFeaturedCourses as a function', async () => {
    const { getFeaturedCourses } = await import('../../../examples/newPagesExamples');
    expect(typeof getFeaturedCourses).toBe('function');
  });

  it('should export getForumPosts as a function', async () => {
    const { getForumPosts } = await import('../../../examples/newPagesExamples');
    expect(typeof getForumPosts).toBe('function');
  });

  it('should export getServiceStatusWithHistory as a function', async () => {
    const { getServiceStatusWithHistory } = await import('../../../examples/newPagesExamples');
    expect(typeof getServiceStatusWithHistory).toBe('function');
  });
});
