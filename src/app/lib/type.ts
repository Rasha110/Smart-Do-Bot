export type Task= {
    id:string;
    title:string;
  is_completed:boolean;
  user_id: string;

  created_at: string; 
  updated_at?: string; 
  notes?: string;
  };