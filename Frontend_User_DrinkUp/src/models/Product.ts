export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: {
    S: number;
    M: number;
    L: number;
  };
  category: string;
  imageUrl?: string;
  toppings: { _id: string; name: string; price: number }[];
  createdAt: string;
}
