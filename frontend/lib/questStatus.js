export const resolveAssignmentProgressStatus = (assignment) => {
  const rawStatus = assignment?.progress?.status || assignment?.response?.status;

  if (rawStatus === 'completed' || rawStatus === 'complete' || rawStatus === 'done') {
    return 'completed';
  }

  const progressPercent = Number(assignment?.progress?.percent);
  if (!Number.isNaN(progressPercent) && progressPercent >= 100) {
    return 'completed';
  }

  if (assignment?.progress?.completedAt) {
    return 'completed';
  }

  const responseCount =
    assignment?.response?.responses?.length ||
    assignment?.responseCount ||
    assignment?.progress?.responseCount ||
    0;
  const totalItems = assignment?.content?.contentItems?.length || 0;

  if (totalItems > 0 && responseCount >= totalItems) {
    return 'completed';
  }

  if (rawStatus === 'in_progress' || rawStatus === 'progress' || rawStatus === 'active') {
    return 'in_progress';
  }

  return 'waiting';
};