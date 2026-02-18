/** Shared fetch utility for all stock API hooks */
export async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || `Failed to fetch ${url}`);
  }
  return json.data;
}
