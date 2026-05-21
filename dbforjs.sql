CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    special_code VARCHAR(10) DEFAULT '000000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

INSERT INTO roles (name) VALUES ('admin'), ('user');



CREATE TABLE IF NOT EXISTS order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO order_statuses (name) VALUES 
('Новый'), 
('В обработке'), 
('Доставка'), 
('Выполнен'), 
('Отменен')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES order_statuses(id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

UPDATE orders SET status_id = (SELECT id FROM order_statuses WHERE name = 'Новый') 
WHERE status_id IS NULL;

CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

ALTER TABLE orders ALTER COLUMN status_id SET NOT NULL;

INSERT INTO users (username, email, password_hash, role_id, special_code) VALUES
('admin', 'admin@shop.ru', 'hash_admin', 1, 'admin1'),
('ivan', 'ivan@mail.ru', 'hash_ivan', 2, '000000'),
('petr', 'petr@mail.ru', 'hash_petr', 2, '000000');

INSERT INTO products (name, price, stock_quantity) VALUES
('Ноутбук ASUS', 50000.00, 10),
('Смартфон Samsung', 30000.00, 25),
('iPhone 15', 80000.00, 5);

INSERT INTO orders (user_id, total_amount) VALUES
(2, 80000.00),
(3, 30000.00);

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 3, 1, 80000.00),
(2, 2, 1, 30000.00);

CREATE OR REPLACE FUNCTION assign_role_by_code()
RETURNS TRIGGER AS $$
DECLARE
    admin_role_id INTEGER;
    user_role_id INTEGER;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    
    IF NEW.special_code IS NULL OR NEW.special_code = '' THEN
        NEW.special_code := '000000';
    END IF;
    
    IF NEW.special_code = 'admin1' THEN
        NEW.role_id := admin_role_id;
    ELSE
        NEW.role_id := user_role_id;
        IF NEW.special_code != '000000' THEN
            NEW.special_code := '000000';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_role_before_insert
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION assign_role_by_code();

SELECT * FROM users