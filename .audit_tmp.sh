cd "$1"
echo "=== docs/archive completo ==="
ls docs/archive/
echo "=== count ==="
ls docs/archive/ | wc -l
echo "=== busca PARIDADE/evidencias/reproduzir em todo o repo ==="
find . -iname "*paridade*" -not -path "./node_modules/*"
find . -iname "*evidencias*" -not -path "./node_modules/*"
find . -iname "*reproduzir*" -not -path "./node_modules/*"
echo "=== git log do dir auditoria-20260912 na main ==="
git --no-pager log --all --oneline -- "docs/auditoria-20260912/*" | head -10