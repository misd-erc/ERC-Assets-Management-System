export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
