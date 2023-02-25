export function pickVisibleFromZViewStates(
  partials: NullableFields<IZPopupSubviewState>
) {
  return Object.entries(partials).reduce((accu, [viewType, state]) => {
    (accu as any)[viewType] = !!state?.visible;

    return accu;
  }, {} as IZPopupSubviewVisibleState);
}
