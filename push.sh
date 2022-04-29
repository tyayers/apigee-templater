git stage .
git commit -m "$2"
git tag -a "$1"
git push origin main && git push --tags