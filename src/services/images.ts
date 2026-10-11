import sharp from 'sharp';
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
  );
function lines(text: string, width = 30): string[] {
  const words = text.trim().split(/\s+/),
    result: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > width && line) {
      result.push(line);
      line = '';
    }
    line += `${line ? ' ' : ''}${word}`;
  }
  if (line) result.push(line);
  return result.slice(0, 5);
}
export async function renderCard(
  kind: 'meme' | 'quote',
  first: string,
  second: string,
): Promise<Buffer> {
  const text = (value: string, y: number, size: number) =>
    lines(value)
      .map(
        (line, n) =>
          `<text x="400" y="${y + n * (size + 10)}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="#ffffff">${xml(line)}</text>`,
      )
      .join('');
  const svg =
    kind === 'meme'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="400" fill="#3730a3"/><rect y="400" width="800" height="400" fill="#be123c"/>${text(first, 90, 32)}${text(second, 490, 32)}</svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" rx="24" fill="#18181b"/><rect x="40" y="60" width="8" height="480" fill="#a78bfa"/>${text(first, 150, 32)}${text(`— ${second}`, 490, 22)}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
