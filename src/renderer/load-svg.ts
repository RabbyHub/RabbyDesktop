// const requireAll = (requireContext) => {
//   requireContext.keys().forEach((key) => {
//       requireContext(key);
//   });
// };

// // require all svg for es6, output sprite as webapp/style/res/svg.sp-next.svg
// requireAll(
//   require.context('@style/res/svg', true, /\.svg$/)
// );

// // require all svg for svg, output sprite as webapp/style/res/svg/<dir>.sp.svg
// requireAll(require.context('@webapp/style/res/svg/btmbar', false, /\.svg$/));
// requireAll(require.context('@webapp/style/res/svg/cover', false, /\.svg$/));
// requireAll(require.context('@webapp/style/res/svg/icon', false, /\.svg$/));
// requireAll(require.context('@webapp/style/res/svg/sidebar', false, /\.svg$/));
// requireAll(require.context('@webapp/style/res/svg/topbar', false, /\.svg$/));
// requireAll(require.context('@webapp/style/res/svg/menu', false, /\.svg$/));
