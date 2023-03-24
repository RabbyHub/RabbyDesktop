# aws s3 ls s3://$RABBY_BUILD_BUCKET/rabby/wallet-desktop-updater-test/
TEST_UPDATE_TARGET_VERSION=99.99.99;

if [[ $OSTYPE == "darwin"* ]]; then
  # darwin x64
  files=(
    ./release/build-darwin-x64-reg/*.yml
    ./release/build-darwin-x64-reg/rabby-wallet-desktop-installer-x64-$TEST_UPDATE_TARGET_VERSION.dmg*
    ./release/build-darwin-x64-reg/rabby-wallet-desktop-installer-x64-$TEST_UPDATE_TARGET_VERSION.zip*
  )

  for file in "${files[@]}"; do
    echo "[darwin-x64] upload test update target: $file"
    aws s3 cp $file s3://$RABBY_BUILD_BUCKET/rabby/wallet-desktop-updater-test/darwin-x64/
  done

  # darwin arm64
  files=(
    ./release/build-darwin-arm64-reg/*.yml
    ./release/build-darwin-arm64-reg/rabby-wallet-desktop-installer-arm64-$TEST_UPDATE_TARGET_VERSION.dmg*
    ./release/build-darwin-arm64-reg/rabby-wallet-desktop-installer-arm64-$TEST_UPDATE_TARGET_VERSION.zip*
  )

  for file in "${files[@]}"; do
    echo "[darwin-arm64] upload test update target: $file"
    aws s3 cp $file s3://$RABBY_BUILD_BUCKET/rabby/wallet-desktop-updater-test/darwin-arm64/
  done
else
  # win32 x64
  files=(
    ./release/build-win32-x64-reg/*.yml
    ./release/build-win32-x64-reg/rabby-wallet-desktop-installer-x64-$TEST_UPDATE_TARGET_VERSION.exe*
  )

  for file in "${files[@]}"; do
    echo "[win32-x64] upload test update target: $file"
    aws s3 cp $file s3://$RABBY_BUILD_BUCKET/rabby/wallet-desktop-updater-test/win32-x64/
    # aws s3 cp $file s3://$RABBY_BUILD_BUCKET/rabby/wallet-desktop-updater-test-unsigned/win32-x64/
  done
fi
