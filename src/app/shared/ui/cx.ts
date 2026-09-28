/** Class names joined with spaces; `false`, `null` and `undefined` are left out. */
export function cx(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter((name): name is string => typeof name === 'string' && name !== '').join(' ');
}
