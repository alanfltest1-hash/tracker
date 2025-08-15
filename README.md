# Receipt Inventory Tracking

End-to-end sample:
- **Front-end** (vanilla HTML/JS) for receipt entry
- **Node/Express API** to call SQL Server stored procedure using a **table-valued parameter**
- **SQL Server schema** (tables + UDTT + stored proc) with **Vendors** auto-lookup/insert

## Quick Start

### 1) Database
- Open `sql/schema.sql` in SSMS / Azure Data Studio and execute it on your database.
- This creates: `Vendors`, `Payment`, `PaymentItemDetail`, `Inventory`, `SquareInventory`, `TaxDeductions`,
  plus UDTT `dbo.ItemListType` and proc `dbo.InsertReceiptData`.

### 2) App
```bash
cp .env.example .env
# edit .env with your SQL connection

npm ci
npm run dev
