const NO_SELECTOR = 'NO_SELECTOR';
export function styledId(
  /* eslint-disable-next-line @typescript-eslint/ban-types */
  jsxComponent: (Function & { styledComponentId?: string }) | string
) {
  if (typeof jsxComponent === 'string') {
    return `.${jsxComponent}`;
  }

  if (jsxComponent != null && jsxComponent.styledComponentId) {
    return `.${jsxComponent.styledComponentId}`;
  }

  return NO_SELECTOR;
}
