export const getHslFromText = (text: string) => {
  if (!text) return "hsl(210 16% 24%)";
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 55 + (Math.abs(hash) % 15);
  const light = 40 + (Math.abs(hash >> 3) % 10);
  return `hsl(${hue} ${sat}% ${light}%)`;
};
