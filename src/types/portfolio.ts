export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  isActive?: boolean;
}
