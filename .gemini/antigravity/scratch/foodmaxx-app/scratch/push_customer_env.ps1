$vars = @{
  "VITE_FIREBASE_API_KEY" = "AIzaSyDy6BwipyBfJcpSbw0ISce54kKE3UQFabQ"
  "VITE_FIREBASE_AUTH_DOMAIN" = "orderfoodmaxx.firebaseapp.com"
  "VITE_FIREBASE_PROJECT_ID" = "orderfoodmaxx"
  "VITE_FIREBASE_STORAGE_BUCKET" = "orderfoodmaxx.firebasestorage.app"
  "VITE_FIREBASE_MESSAGING_SENDER_ID" = "146566000959"
  "VITE_FIREBASE_APP_ID" = "1:146566000959:web:15f757c02ebbbb9e4b238a"
  "VITE_USE_FIREBASE_EMULATOR" = "false"
}

foreach ($key in $vars.Keys) {
  $val = $vars[$key]
  Write-Host "Adding $key..."
  $val | npx vercel env add $key production --yes
  $val | npx vercel env add $key preview --yes
}
Write-Host "Done adding customer env vars"
