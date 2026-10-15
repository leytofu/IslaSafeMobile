let token: string | null = null;
export async function readToken() {
  return token;
}
export async function saveToken(value: string) {
  token = value;
}
export async function clearToken() {
  token = null;
}
