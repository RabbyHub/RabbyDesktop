export const appIsProd = process.env.NODE_ENV === 'production';
export const appIsDev = !appIsProd;
