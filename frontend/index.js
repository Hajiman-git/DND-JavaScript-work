const API = 'http://localhost:3000';

async function checkUser() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const res = await fetch(`${API}/auth/me`, {
                headers: { 'Authorization': token }
            });
            
            if (res.ok) {
                const user = await res.json();
                document.getElementById('userInfo').innerHTML = `
                    ${user.username} (${user.role}) 
                    <button onclick="logout()">Выйти</button>
                `;
                
                if (user.role === 'admin') {
                    showAdminPanel();
                }
            } else {
                localStorage.removeItem('token');
                document.getElementById('userInfo').innerHTML = `<a href="/login.html">Войти</a>`;
            }
        } catch (error) {
            document.getElementById('userInfo').innerHTML = `<a href="/login.html">Войти</a>`;
        }
    } else {
        document.getElementById('userInfo').innerHTML = `<a href="/login.html">Войти</a>`;
    }
}

function logout() {
    localStorage.removeItem('token');
    location.href = '/';
}

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products`);
        const products = await res.json();
        
        const container = document.getElementById('products');
        container.innerHTML = '';
        
        for (let p of products) {
            container.innerHTML += `
                <div class="card">
                    <h3>${p.name}</h3>
                    <p>${p.price} ₽</p>
                    <p>В наличии: ${p.stock_quantity} шт.</p>
                    <button onclick="buyProduct(${p.id})">Купить</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}


async function buyProduct(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Войдите в систему');
        location.href = '/login.html';
        return;
    }
    
    const res = await fetch(`${API}/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    
    if (res.ok) {
        showNotification('Товар добавлен в корзину', 'success');
    } else {
        showNotification('Ошибка при добавлении', 'error');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

function showAdminPanel() {
    const productsContainer = document.getElementById('products');
    
    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <h2>АДМИН ПАНЕЛЬ</h2>
        
        <h3>ДОБАВИТЬ ТОВАР</h3>
        <div class="admin-form">
            <input type="text" id="newName" placeholder="Название">
            <input type="number" id="newPrice" placeholder="Цена">
            <input type="number" id="newStock" placeholder="Количество">
            <button id="addProductBtn">ДОБАВИТЬ</button>
        </div>
        
        <hr>
        
        <h3>СПИСОК ТОВАРОВ</h3>
        <div id="adminProductsList"></div>
    `;
    
    productsContainer.parentNode.insertBefore(adminPanel, productsContainer);
    
    document.getElementById('addProductBtn').onclick = createProduct;
    
    loadAdminProducts();
}

async function loadAdminProducts() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/products`, {
        headers: { 'Authorization': token }
    });
    const products = await res.json();
    
    const container = document.getElementById('adminProductsList');
    container.innerHTML = '';
    
    for (let p of products) {
        const productDiv = document.createElement('div');
        productDiv.className = 'admin-product';
        productDiv.innerHTML = `
            <div class="product-info">
                <strong>${p.name}</strong> | Цена: ${p.price} ₽ | В наличии: ${p.stock_quantity} шт.
            </div>
            <div class="product-actions">
                <button class="edit-btn" data-id="${p.id}">ИЗМЕНИТЬ</button>
                <button class="delete-btn" data-id="${p.id}">УДАЛИТЬ</button>
            </div>
        `;
        
        productDiv.querySelector('.edit-btn').onclick = () => updateProduct(p.id);
        productDiv.querySelector('.delete-btn').onclick = () => deleteProduct(p.id);
        
        container.appendChild(productDiv);
    }
}

async function createProduct() {
    const token = localStorage.getItem('token');
    const name = document.getElementById('newName').value;
    const price = document.getElementById('newPrice').value;
    const stock = document.getElementById('newStock').value;
    
    if (!name || !price || !stock) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const res = await fetch(`${API}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                name: name,
                price: Number(price),
                stock_quantity: Number(stock)
            })
        });
        
        if (res.ok) {
            alert('Товар добавлен');
            document.getElementById('newName').value = '';
            document.getElementById('newPrice').value = '';
            document.getElementById('newStock').value = '';
            loadAdminProducts();
            loadProducts();
        } else {
            alert('Ошибка при добавлении');
        }
    } catch (error) {
        alert('Ошибка сервера');
    }
}

async function updateProduct(id) {
    const newName = prompt('Введите новое название:');
    if (!newName) return;
    
    const newPrice = prompt('Введите новую цену:');
    if (!newPrice) return;
    
    const newStock = prompt('Введите новое количество:');
    if (!newStock) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                name: newName,
                price: Number(newPrice),
                stock_quantity: Number(newStock)
            })
        });
        
        if (res.ok) {
            alert('Товар обновлен');
            loadAdminProducts();
            loadProducts();
        } else {
            alert('Ошибка при обновлении');
        }
    } catch (error) {
        alert('Ошибка сервера');
    }
}

async function deleteProduct(id) {
    if (!confirm('Удалить этот товар?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });
        
        if (res.ok) {
            alert('Товар удален');
            loadAdminProducts();
            loadProducts();
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        alert('Ошибка сервера');
    }
}

checkUser();
loadProducts();