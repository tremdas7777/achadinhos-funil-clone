# Achadinhos — Funil Espelho Oval

Clone do funil de vendas (produto → checkout Pix → confirmação → upsell → obrigado) com integração **IronPay**.

**Repositório:** https://github.com/tremdas7777/achadinhos-funil-clone

---

## Rodar local (Express)

```bash
cp .env.example .env
# Preencha IRONPAY_* no .env
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

Sem `VITE_SUPABASE_URL`, o frontend usa `/api` (proxy para Express).

---

## Publicar no Lovable

O Lovable **não importa** repositório existente. Use este fluxo:

### 1. Criar projeto no Lovable

1. Acesse [lovable.dev](https://lovable.dev) → **New Project**
2. **Project settings → Git** → conecte GitHub e crie o repositório
3. Anote a URL do repo criado pelo Lovable (ex.: `github.com/seu-user/nome-do-projeto`)

### 2. Enviar este código para o repo do Lovable

No terminal, na pasta deste projeto:

```bash
git remote add lovable https://github.com/SEU-USUARIO/REPO-LOVABLE.git
git push lovable main --force
```

Ou clone o repo do Lovable, copie os arquivos deste projeto (exceto `.git` e `node_modules`) e faça push.

### 3. Aplicar migration do banco

No chat do Lovable, peça:

> Apply pending Supabase migrations

Isso cria a tabela `orders` para guardar pedidos.

### 4. Deploy da Edge Function

No chat do Lovable:

> Deploy the achadinhos-api edge function

### 5. Secrets (Lovable Cloud → Secrets)

| Secret | Descrição |
|--------|-----------|
| `IRONPAY_API_TOKEN` | Token da API IronPay |
| `IRONPAY_OFFER_HASH` | Ticket R$ 57,50 (só espelho) |
| `IRONPAY_BUMP_OFFER_HASH` | Ticket R$ 77,40 (espelho + bump) |
| `IRONPAY_PRODUCT_HASH` | Hash do produto espelho |
| `IRONPAY_POSTBACK_URL` | `https://SEU-PROJETO.supabase.co/functions/v1/achadinhos-api/webhooks/ironpay` |
| `PUBLIC_BASE_URL` | URL pública do app (ex.: `https://seu-app.lovable.app`) |

O Lovable já injeta `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no frontend.

### 6. Webhook IronPay

No painel IronPay, configure o postback:

```
https://SEU-PROJETO.supabase.co/functions/v1/achadinhos-api/webhooks/ironpay
```

### 7. Publicar

No Lovable, clique **Publish** para colocar no ar em `*.lovable.app` ou domínio customizado (plano Pro).

---

## Rotas do funil

| Rota | Página |
|------|--------|
| `/shop/product/:id` | Produto |
| `/shop/checkout` | Checkout Pix |
| `/shop/payment-confirmation` | QR Code Pix |
| `/shop/upsell` | Upsell pós-pagamento |
| `/obrigado-pela-compra` | Obrigado |

---

## Tickets IronPay

| Ticket | Valor | Variável |
|--------|-------|----------|
| Sem bump | R$ 57,50 | `IRONPAY_OFFER_HASH` |
| Com bump | R$ 77,40 | `IRONPAY_BUMP_OFFER_HASH` |

---

## Estrutura

```
src/                    # Frontend React
server/                 # API Express (dev local)
supabase/
  functions/achadinhos-api/   # API IronPay (Lovable/produção)
  migrations/                 # Tabela orders
```

---

## Segurança

Nunca commite `.env`. Rotacione o token IronPay se ele foi exposto.
