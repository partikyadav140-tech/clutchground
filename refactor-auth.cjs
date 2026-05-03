const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/_app/matches.tsx',
  'src/routes/_app/notifications.tsx',
  'src/routes/_app/profile.tsx',
  'src/routes/_app/teams.tsx',
  'src/routes/_app/wallet.tsx'
];

for (const file of files) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) continue;

  let content = fs.readFileSync(p, 'utf8');

  // Replace const { user } = useAuth();
  content = content.replace(/const { user } = useAuth\(\);/g, 'const { user, loading: authLoading } = useAuth();');

  // Replace useEffect block logic
  const targetRegex = /useEffect\(\(\) => \{\s*if \(\!user\) \{\s*if \(\!loading\) router\.navigate\(\{ to: "\/login" \}\);\s*return;\s*\}/g;
  
  content = content.replace(targetRegex, `useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;`);

  fs.writeFileSync(p, content);
  console.log('Fixed', file);
}
