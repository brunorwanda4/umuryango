export const PULL_TO_REFRESH_THRESHOLD = 64;

const MAX_PULL_DISTANCE = 96;
const PULL_RESISTANCE = 0.5;

export function calculatePullDistance({
  startX,
  startY,
  currentX,
  currentY,
}: {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}) {
  const horizontalDistance = Math.abs(currentX - startX);
  const verticalDistance = currentY - startY;

  if (verticalDistance <= 0 || horizontalDistance >= verticalDistance) {
    return 0;
  }

  return Math.min(MAX_PULL_DISTANCE, verticalDistance * PULL_RESISTANCE);
}
