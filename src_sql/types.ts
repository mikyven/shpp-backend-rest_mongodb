export type TItem = {
  id: string;
  text: string;
  checked: boolean;
  login: string;
};

export type TResponseItem = {
  id: number;
  text: string;
  checked: Buffer;
  user: string;
};

export type TUser = {
  login: string;
  pass: string;
};
