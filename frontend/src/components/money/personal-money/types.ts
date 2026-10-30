export type RealTransaction = {
  id: string;
  type: "in" | "out" | "save";
  title: string;
  source: string;
  category: string;
  date: string;
  rawDate: string;
  status: string;
  amount: number;
};
