export function parseFilename(filename: string): { announcement_id: string; page: number } | null {
  // Use regex to capture everything before the last underscore as announcement_id
  const match = filename.match(/^(.+)_(\d+)\.(png|jpg|jpeg)$/i) // Made case-insensitive and added jpg/jpeg
  if (!match) {
    console.error(
      `Invalid filename format: ${filename}. Expected format: "{announcement_id}_{page}.(png|jpg|jpeg)"`
    )
    return null
  }
  const [, announcement_id, pageStr] = match
  const page = parseInt(pageStr, 10)
  if (isNaN(page)) {
    console.error(`Invalid page number parsed from filename: ${filename}`)
    return null
  }
  return { announcement_id, page }
}
