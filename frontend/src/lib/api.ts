export async function generateAnimation(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/generation/generate', {
    method: 'POST',
    body: formData
  })

  return res.json()
}
