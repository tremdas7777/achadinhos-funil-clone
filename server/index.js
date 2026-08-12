import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const app = express();
app.use(cors());
app.use(express.json());

function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function generatePixCode(orderId, amount) {
  const amountStr = amount.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136${orderId.replace(/-/g, '').slice(0, 32)}520400005303986540${amountStr.length}${amountStr}5802BR5925ACHADINHOS BR LOJA6009SAO PAULO62070503***6304ABCD`;
}

app.post('/api/orders', (req, res) => {
  const {
    customer,
    address,
    items,
    bump_items = [],
    payment_method = 'pix',
    insurance = false,
    total,
    subtotal,
    shipping = 0,
  } = req.body;

  if (!customer?.name || !customer?.phone || !customer?.cpf) {
    return res.status(400).json({ error: 'Dados do cliente incompletos' });
  }

  if (!items?.length) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  const orderId = uuidv4();
  const pixCode = generatePixCode(orderId, Number(total));
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;

  const order = {
    id: orderId,
    status: 'pending',
    payment_method,
    customer_name: customer.name,
    customer_email: customer.email || `${customer.phone.replace(/\D/g, '')}@checkout.local`,
    customer_phone: customer.phone,
    customer_cpf: customer.cpf,
    address_street: `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`,
    address_city: address.city,
    address_state: address.state,
    address_zip: address.zip,
    address_neighborhood: address.neighborhood,
    subtotal: Number(subtotal),
    shipping: Number(shipping),
    insurance: insurance ? 10.21 : 0,
    total: Number(total),
    items: [
      ...items.map((i) => ({
        product_id: i.product_id,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
        selected_color: i.selected_color || null,
        selected_size: i.selected_size || null,
      })),
      ...bump_items.map((i) => ({
        product_id: i.product_id,
        product_name: `[Bump] ${i.name}`,
        price: i.price,
        quantity: 1,
        selected_color: null,
        selected_size: null,
      })),
    ],
    pix: {
      qrcode: pixCode,
      code: pixCode,
      emv: pixCode,
      qrcode_image: qrImage,
      qrcode_url: qrImage,
    },
    created_at: new Date().toISOString(),
  };

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);

  res.json({
    order,
    payment: {
      pix: order.pix,
      transaction_id: `TX-${orderId.slice(0, 8).toUpperCase()}`,
    },
  });
});

app.post('/api/orders/:id/confirm-payment', (req, res) => {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pedido não encontrado' });
  orders[idx].status = 'paid';
  orders[idx].paid_at = new Date().toISOString();
  writeOrders(orders);
  res.json({ order: orders[idx] });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ order });
});

app.get('/api/orders', (_req, res) => {
  res.json({ orders: readOrders() });
});

app.post('/api/upsell-payment', (req, res) => {
  const { order_id, offer_id, product_name, shipping_price } = req.body;
  const paymentId = uuidv4();
  const amount = Number(shipping_price);
  const finalPix = generatePixCode(paymentId, amount);
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(finalPix)}`;

  res.json({
    upsell_payment_id: paymentId,
    order_id,
    offer_id,
    product_name,
    amount,
    status: 'pending',
    pix: {
      qrcode: finalPix,
      code: finalPix,
      qrcode_image: qrImage,
    },
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API de pedidos rodando em http://localhost:${PORT}`);
});
