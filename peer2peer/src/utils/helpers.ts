export function generateUniqueId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

export function formatData(data: any): string {
    return JSON.stringify(data, null, 2);
}

export function handleError(error: Error): void {
    console.error('Baj van baszod:', error.message);
}