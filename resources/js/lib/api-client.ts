type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (!token) {
        throw new Error('CSRF token tidak ditemukan.');
    }

    return token;
}

export async function apiRequest<T>(url: string, method: ApiMethod = 'GET', payload?: unknown): Promise<T> {
    const headers: HeadersInit = {
        Accept: 'application/json',
    };

    if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
        headers['X-CSRF-TOKEN'] = getCsrfToken();
    }

    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
        let message = `Request gagal (${response.status})`;

        try {
            const json = (await response.json()) as { message?: string };
            if (json.message) {
                message = json.message;
            }
        } catch {
            // keep default message when response body is not json
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null as T;
    }

    return (await response.json()) as T;
}
