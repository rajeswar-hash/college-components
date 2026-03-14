export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  avatar?: string;
  joinedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  college: string;
  createdAt: string;
  sold: boolean;
  likes: number;
}

export type Category =
  | "Arduino"
  | "Sensors"
  | "Motors"
  | "Tools"
  | "Displays"
  | "Communication"
  | "Power"
  | "Misc";

export type Condition = "New" | "Like New" | "Good" | "Fair";

export const CATEGORIES: Category[] = [
  "Arduino",
  "Sensors",
  "Motors",
  "Tools",
  "Displays",
  "Communication",
  "Power",
  "Misc",
];

export const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair"];
