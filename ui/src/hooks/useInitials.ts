/** "Ayush Agrawal" -> "AA" */
export const toInitials = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
