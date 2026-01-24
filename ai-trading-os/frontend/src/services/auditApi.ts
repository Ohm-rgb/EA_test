import { AuthService } from "./auth";

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AuditLog {
    id: number;
    action: string;
    target_table: string;
    target_id: string;
    old_value: any;
    new_value: any;
    performed_by: string;
    performed_at: string;
}

export const AuditApi = {
    getLogs: async (filters: { target_id?: string; action?: string; limit?: number } = {}): Promise<AuditLog[]> => {
        const params = new URLSearchParams();
        if (filters.target_id) params.append('target_id', filters.target_id);
        if (filters.action) params.append('action', filters.action);
        if (filters.limit) params.append('limit', filters.limit.toString());

        const token = AuthService.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`, {
            headers
        });

        if (response.status === 401) {
            AuthService.logout();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        }

        return response.json();
    }
};
