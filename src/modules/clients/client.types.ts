export type EntityType = 'Lead' | 'Client';

export interface ContactHistory {
  id: string;
  method: string;
  summary: string;
  outcome?: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    name?: string; 
  };
  inquiry?: {
    id: string;
    name?: string;
  };
  client?: {
    id: string;
    name?: string;
  };
}

export interface AddContactHistoryData {
  method: string;
  summary: string;
  outcome?: string;
  timestamp: Date;
  entity: {
    entityId: string;
    entityType: EntityType;
  };
  userId: string;
}