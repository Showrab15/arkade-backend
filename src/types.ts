export interface ApiRoute {
  id: string;
  module: "Auth" | "Products" | "Cart" | "Wishlist" | "Orders" | "Newsletter" | "Contact" | "Districts";
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  authRequired: boolean;
  adminOnly?: boolean;
  requestHeader?: Record<string, string>;
  requestBody?: any;
  responseBody: any;
}

export interface BangladeshDivision {
  division: string;
  districts: string[];
}
