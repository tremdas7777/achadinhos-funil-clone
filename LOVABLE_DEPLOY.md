# Deploy no Lovable — passo a passo

Código no GitHub: https://github.com/tremdas7777/achadinhos-funil-clone

---

## 1. Criar projeto no Lovable

1. Acesse **https://lovable.dev** e faça login
2. Clique **New Project**
3. Vá em **Project settings → Git → GitHub** e conecte sua conta

### Opção A — Usar este repositório (recomendado)

Se o Lovable permitir **Use existing repository**, selecione:

```
tremdas7777/achadinhos-funil-clone
```

### Opção B — Repo novo criado pelo Lovable

Se o Lovable criar um repo novo, no terminal:

```bash
cd "/Users/ulissescardoso/pasta sem título"
git remote add lovable https://github.com/SEU-USUARIO/REPO-DO-LOVABLE.git
git push lovable main --force
```

---

## 2. Colar no chat do Lovable (copie tudo)

```
Apply pending Supabase migrations from supabase/migrations/

Deploy the achadinhos-api edge function from supabase/functions/achadinhos-api/

Este projeto é um funil de vendas React + Vite. O frontend chama a Edge Function achadinhos-api para gerar Pix via IronPay. Não remova supabase/functions/achadinhos-api nem as rotas em src/pages/.
```

---

## 3. Secrets — Lovable Cloud → Secrets

Adicione manualmente (valores do seu `.env` local):

| Secret | Valor |
|--------|--------|
| `IRONPAY_API_TOKEN` | seu token IronPay |
| `IRONPAY_OFFER_HASH` | `taat5` (R$ 57,50) |
| `IRONPAY_BUMP_OFFER_HASH` | `c1dsk` (R$ 77,40) |
| `IRONPAY_PRODUCT_HASH` | `30zrd0bm8y` |

Depois de publicar, pegue a URL do projeto (ex.: `https://xxxx.lovable.app`) e o **Project ID Supabase** em Project settings, então adicione:

| Secret | Valor |
|--------|--------|
| `PUBLIC_BASE_URL` | `https://SEU-APP.lovable.app` |
| `IRONPAY_POSTBACK_URL` | `https://SEU-PROJETO.supabase.co/functions/v1/achadinhos-api/webhooks/ironpay` |

> O Lovable injeta automaticamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no frontend.

---

## 4. Webhook IronPay

No painel IronPay, configure o postback:

```
https://SEU-PROJETO.supabase.co/functions/v1/achadinhos-api/webhooks/ironpay
```

---

## 5. Publicar

1. No Lovable, clique **Publish** (canto superior direito)
2. Aguarde o build terminar
3. Teste o funil: produto → checkout → Pix

---

## 6. Testar Pix em produção

1. Abra a URL publicada (`*.lovable.app`)
2. Vá até o checkout
3. Preencha **e-mail**, telefone, CPF e endereço completo
4. Clique **Finalizar com Pix**
5. Deve aparecer QR Code real da IronPay

Se der erro, veja **Cloud → Logs** da Edge Function `achadinhos-api`.

---

## Rotas do funil

| URL | Página |
|-----|--------|
| `/shop/product/851678b1-db4b-4c4e-989a-7097c17f6e3b` | Produto |
| `/shop/checkout` | Checkout |
| `/shop/payment-confirmation` | Pix |
| `/shop/upsell` | Upsell |
| `/obrigado-pela-compra` | Obrigado |

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| "Não foi possível conectar à API" | Edge Function não publicada → peça deploy no chat |
| Pix não gera | Secrets IronPay faltando ou incorretos |
| 404 nas rotas | Clique Publish de novo; `_redirects` já está em `public/` |
| Pedido sem Pix | Verifique logs da Edge Function no Lovable Cloud |
