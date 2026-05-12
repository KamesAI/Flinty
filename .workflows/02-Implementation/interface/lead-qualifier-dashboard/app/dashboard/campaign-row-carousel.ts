export function buildCampaignCarouselItems<T extends { key: string }>(stages: T[]) {
  return [0, 1].flatMap((loopIndex) =>
    stages.map((stage) => ({
      ...stage,
      id: `${stage.key}-${loopIndex}`,
    }))
  );
}
