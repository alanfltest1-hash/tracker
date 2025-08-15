const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const pool = new sql.ConnectionPool({
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: { encrypt: String(process.env.SQL_ENCRYPT || 'false') === 'true' }
});

let poolConn;
async function getPool() {
  if (!poolConn) poolConn = pool.connect();
  return poolConn;
}

app.post('/api/receipts', async (req, res) => {
  try {
    const {
      VendorName, DateOrder, OrderNumber,
      Shipping = 0, SalesTax = 0, Discount = 0, Items = []
    } = req.body;

    if (!VendorName || !DateOrder || !OrderNumber || !Array.isArray(Items) || Items.length === 0) {
      return res.status(400).send('Missing required fields or items.');
    }

    const tvp = new sql.Table('dbo.ItemListType');
    tvp.columns.add('ItemDescription', sql.NVarChar(255));
    tvp.columns.add('Price', sql.Decimal(10, 2));
    tvp.columns.add('Quantity', sql.Int);
    tvp.columns.add('Category', sql.NVarChar(100));

    Items.forEach(it => {
      tvp.rows.add(
        String(it.ItemDescription || '').slice(0,255),
        Number(it.Price || 0),
        parseInt(it.Quantity || 0),
        String(it.Category || '').slice(0,100)
      );
    });

    await getPool();
    const request = new sql.Request(pool);
    request.input('VendorName', sql.NVarChar(255), VendorName);
    request.input('DateOrder', sql.Date, DateOrder);
    request.input('OrderNumber', sql.NVarChar(100), OrderNumber);
    request.input('Shipping', sql.Decimal(10,2), Shipping);
    request.input('SalesTax', sql.Decimal(10,2), SalesTax);
    request.input('Discount', sql.Decimal(10,2), Discount);
    request.input('ItemList', tvp);

    const result = await request.execute('dbo.InsertReceiptData');
    const row = result.recordset?.[0] || {};
    res.json({ ok: true, PaymentID: row.PaymentID, VendorID: row.VendorID });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || 'Server error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
