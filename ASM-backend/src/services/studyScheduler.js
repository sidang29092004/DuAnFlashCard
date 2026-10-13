function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function applyStudyRating(progress, rating, now = new Date()) {
  const correctCount = progress.correct_count || 0;
  const incorrectCount = progress.incorrect_count || 0;
  const stability = progress.stability || 1;
  const difficulty = progress.difficulty || 1;

  const next = {
    last_result: rating,
    last_review_at: now,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    stability,
    difficulty,
    status: progress.status || "new",
    next_review_at: addDays(now, 1),
  };

  if (rating === "again") {
    next.incorrect_count += 1;
    next.status = "learning";
    next.stability = Math.max(1, round(stability * 0.6));
    next.difficulty = Math.min(10, round(difficulty + 0.5));
    next.next_review_at = addMinutes(now, 5);
    return next;
  }

  if (rating === "hard") {
    next.correct_count += 1;
    next.status = next.correct_count >= 2 ? "review" : "learning";
    next.stability = round(stability + 0.5);
    next.difficulty = Math.min(10, round(difficulty + 0.2));
    next.next_review_at = addMinutes(now, 60 * Math.max(1, next.correct_count));
    return next;
  }

  if (rating === "good") {
    next.correct_count += 1;
    next.status = next.correct_count >= 4 ? "mastered" : "review";
    next.stability = round(stability * 1.7 + 1);
    next.difficulty = Math.max(1, round(difficulty - 0.1));
    next.next_review_at = addDays(now, Math.max(1, Math.round(next.stability)));
    return next;
  }

  next.correct_count += 1;
  next.status = next.correct_count >= 3 ? "mastered" : "review";
  next.stability = round(stability * 2.4 + 2);
  next.difficulty = Math.max(1, round(difficulty - 0.3));
  next.next_review_at = addDays(now, Math.max(2, Math.round(next.stability)));
  return next;
}

module.exports = { applyStudyRating };
