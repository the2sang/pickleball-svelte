export const defaultApiFetch = (input, init) => {
  const url = typeof input === 'string' ? input : String(input);
  return fetch(url, init);
};
