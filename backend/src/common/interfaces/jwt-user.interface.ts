import { Role } from '../enums/role.enum';

export interface JwtUser {
  id: string;
  email: string;
  role: Role;
}
