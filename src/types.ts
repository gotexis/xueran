export type RoleType = 'townsfolk' | 'outsider' | 'minion' | 'demon';

export type Role = {
  name: string;
  type: RoleType;
};

export type Player = {
  number: number;
  role: Role;
  isDead: boolean;
  drunkRole?: Role;
};

export type PlayerCounts = {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}; 