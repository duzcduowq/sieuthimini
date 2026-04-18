const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./shop.db');

db.serialize(() => {
    // 1. Tạo và nạp lại bảng Sản phẩm
    db.run(`DROP TABLE IF EXISTS products`);
    db.run(`CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER, category TEXT, image TEXT)`);
    
    // 2. Bảng Đơn hàng
    db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT, total_price INTEGER)`);
    
    // 3. Bảng Người dùng (Tài khoản)
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);

    // 4. Bơm 30 sản phẩm vào kho
    const insert = db.prepare("INSERT INTO products (name, price, category, image) VALUES (?, ?, ?, ?)");
    const productsData = [
        // --- ĐỒ ĂN ---
        ['Mì Hảo Hảo', 5000, 'Đồ ăn', '/image/mi.jpg'],
        ['Gạo ST25 5kg', 150000, 'Đồ ăn', '/image/gao.jpg'],
        ['Trứng gà (10 quả)', 32000, 'Đồ ăn', '/image/trung.jpg'],
        ['Snack Khoai Tây', 12000, 'Đồ ăn', '/image/snack.jpg'],
        ['Bánh mì Sandwich', 25000, 'Đồ ăn', '/image/banhmi.jpg'],
        ['Xúc xích Vissan', 45000, 'Đồ ăn', '/image/xucxich.jpg'],
        ['Thịt bò Úc 500g', 180000, 'Đồ ăn', '/image/thitbo.jpg'],
        ['Rau cải ngọt 1kg', 20000, 'Đồ ăn', '/image/rau.jpg'],
        ['Cà chua Đà Lạt', 25000, 'Đồ ăn', '/image/cachua.jpg'],
        ['Táo Mỹ 1kg', 65000, 'Đồ ăn', '/image/tao.jpg'],
        
        // --- ĐỒ UỐNG ---
        ['Coca Cola 330ml', 10000, 'Đồ uống', '/image/coca.jpg'],
        ['Sữa tươi 1L', 35000, 'Đồ uống', '/image/sua.jpg'],
        ['Nước suối', 5000, 'Đồ uống', '/image/nuocsuoi.jpg'],
        ['Trà Ô Long', 12000, 'Đồ uống', '/image/traolong.jpg'],
        ['Bia Heineken', 18000, 'Đồ uống', '/image/bia.jpg'],
        ['Nước cam ép', 40000, 'Đồ uống', '/image/nuoccam.jpg'],
        ['Cà phê lon', 15000, 'Đồ uống', '/image/caphe.jpg'],
        ['Nước tăng lực', 13000, 'Đồ uống', '/image/tangluc.jpg'],
        ['Nước ép táo', 42000, 'Đồ uống', '/image/eptao.jpg'],
        ['Trà đào cam sả', 30000, 'Đồ uống', '/image/tradao.jpg'],

        // --- GIA DỤNG ---
        ['Nước mắm', 45000, 'Gia dụng', '/image/nuocmam.jpg'],
        ['Dầu ăn 1L', 55000, 'Gia dụng', '/image/dauan.jpg'],
        ['Bột giặt 3kg', 145000, 'Gia dụng', '/image/botgiat.jpg'],
        ['Nước rửa chén', 35000, 'Gia dụng', '/image/ruachen.jpg'],
        ['Giấy vệ sinh', 60000, 'Gia dụng', '/image/giay.jpg'],
        ['Kem đánh răng', 32000, 'Gia dụng', '/image/kemdanhrang.jpg'],
        ['Dầu gội 600g', 120000, 'Gia dụng', '/image/daugoi.jpg'],
        ['Sữa tắm', 95000, 'Gia dụng', '/image/suatam.jpg'],
        ['Nước lau sàn', 45000, 'Gia dụng', '/image/lausan.jpg'],
        ['Nước xả vải', 85000, 'Gia dụng', '/image/xavai.jpg']
    ];

    productsData.forEach(p => insert.run(p[0], p[1], p[2], p[3]));
    insert.finalize();
    console.log("✅ Đã khởi tạo xong Database với 30 sản phẩm!");
});

// --- API TÀI KHOẢN (ĐĂNG KÝ / ĐĂNG NHẬP) ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) return res.status(400).json({ error: "Tên đăng nhập này đã có người dùng rồi!" });
        res.json({ message: "Tạo tài khoản thành công! Đang tự động đăng nhập..." });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err || !row) return res.status(401).json({ error: "Sai tên tài khoản hoặc mật khẩu!" });
        res.json({ message: "Đăng nhập thành công!", user: row.username });
    });
});

// --- API SẢN PHẨM & ĐƠN HÀNG ---
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { customer_name, total_price } = req.body;
    db.run("INSERT INTO orders (customer_name, total_price) VALUES (?, ?)", [customer_name, total_price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "🎉 Đơn hàng #" + this.lastID + " đã được ghi nhận!" });
    });
});

app.listen(3000, () => {
    console.log("Server đang chạy tại: http://localhost:3000");
});