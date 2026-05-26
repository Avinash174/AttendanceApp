export type AuthUser = {
  pkUserId: string;
  UserName: string;
  Password: string;
  Answer: string;
  Sync: string;
  SysDefined: boolean;
  DateTimeStamp: string;
  fkUserId: string;
  LastStatus: string;
  fkECId: string | null;
  OwnRecords: boolean;
  OtherRecords: boolean;
  Mobile: string;
  fkEmpId: number;
  ProfileImage: string | null;
  Email: string | null;
  Phone: string | null;
};

export type LoginResponse = {
  success: boolean;
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginCredentials = {
  UserName: string;
  Password: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};
