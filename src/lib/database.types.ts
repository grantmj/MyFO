export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    auth_id: string | null
                    email: string | null
                    password: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    auth_id?: string | null
                    email?: string | null
                    password?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    auth_id?: string | null
                    email?: string | null
                    password?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            plans: {
                Row: {
                    id: string
                    user_id: string
                    start_date: string
                    end_date: string
                    disbursement_date: string
                    starting_balance: number
                    grants: number
                    loans: number
                    work_study_monthly: number
                    other_income_monthly: number
                    fixed_costs: Json
                    variable_budgets: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    start_date: string
                    end_date: string
                    disbursement_date: string
                    starting_balance?: number
                    grants?: number
                    loans?: number
                    work_study_monthly?: number
                    other_income_monthly?: number
                    fixed_costs?: Json
                    variable_budgets?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    start_date?: string
                    end_date?: string
                    disbursement_date?: string
                    starting_balance?: number
                    grants?: number
                    loans?: number
                    work_study_monthly?: number
                    other_income_monthly?: number
                    fixed_costs?: Json
                    variable_budgets?: Json
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "plans_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    description: string
                    amount: number
                    category: string
                    merchant_guess: string | null
                    source: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    description: string
                    amount: number
                    category: string
                    merchant_guess?: string | null
                    source?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    description?: string
                    amount?: number
                    category?: string
                    merchant_guess?: string | null
                    source?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            planned_items: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    date: string
                    amount: number
                    category: string
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    date: string
                    amount: number
                    category: string
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    date?: string
                    amount?: number
                    category?: string
                    notes?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "planned_items_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            fafsa_checklist: {
                Row: {
                    id: string
                    user_id: string
                    create_fsa_id: boolean
                    gather_tax_docs: boolean
                    list_schools: boolean
                    submit_fafsa: boolean
                    verification: boolean
                    review_award: boolean
                    accept_aid: boolean
                    mark_calendar: boolean
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    create_fsa_id?: boolean
                    gather_tax_docs?: boolean
                    list_schools?: boolean
                    submit_fafsa?: boolean
                    verification?: boolean
                    review_award?: boolean
                    accept_aid?: boolean
                    mark_calendar?: boolean
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    create_fsa_id?: boolean
                    gather_tax_docs?: boolean
                    list_schools?: boolean
                    submit_fafsa?: boolean
                    verification?: boolean
                    review_award?: boolean
                    accept_aid?: boolean
                    mark_calendar?: boolean
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "fafsa_checklist_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            income_sources: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    name: string
                    amount: number
                    frequency: string
                    start_date: string | null
                    end_date: string | null
                    is_loan: boolean
                    interest_rate: number | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    name: string
                    amount: number
                    frequency: string
                    start_date?: string | null
                    end_date?: string | null
                    is_loan?: boolean
                    interest_rate?: number | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    name?: string
                    amount?: number
                    frequency?: string
                    start_date?: string | null
                    end_date?: string | null
                    is_loan?: boolean
                    interest_rate?: number | null
                    notes?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "income_sources_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            emergency_fund: {
                Row: {
                    id: string
                    user_id: string
                    target_amount: number
                    current_amount: number
                    weekly_contribution: number
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    target_amount?: number
                    current_amount?: number
                    weekly_contribution?: number
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    target_amount?: number
                    current_amount?: number
                    weekly_contribution?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "emergency_fund_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
