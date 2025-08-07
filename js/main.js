document.addEventListener('DOMContentLoaded', () => {
  fetch('/DB/products.json')
    .then(response => response.json())
    .then(products => {
      renderGallery(products);
      initializeCart(products);
    });
});

function renderGallery(products) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  products.forEach(product => {
    const card = createCard(product);
    gallery.appendChild(card);
  });
}

function createCard(product) {
  const div = document.createElement('div');
  div.classList.add('product');

  const img = document.createElement('img');
  img.src = product.image;
  img.alt = product.name;
  img.onerror = () => handleImageError(div, product);

  const info = document.createElement('div');
  info.className = 'info';
  info.innerHTML = `
    <h3>${product.name}</h3>
    <p>$${product.price}</p>
    <button class="btn btn-primary btn-sm add-to-cart">Agregar al carrito</button>
  `;

  info.querySelector('button').addEventListener('click', () => addToCart(product.id));
  div.appendChild(img);
  div.appendChild(info);
  return div;
}

function handleImageError(container, product) {
  const existingImg = container.querySelector('img');
  if (existingImg) existingImg.remove();
  const reservedDiv = document.createElement('div');
  reservedDiv.className = 'reserved';
  reservedDiv.innerHTML = '<span class="dot"></span> Fotografía<br>reservada';
  container.insertBefore(reservedDiv, container.firstChild);
}

let cart = [];

function initializeCart(products) {
  const viewCartBtn = document.getElementById('ver-carrito');
  const viewCartIconBtn = document.getElementById('ver-carrito-icon');
  const clearCartBtn = document.getElementById('vaciar-carrito');
  const savedCart = localStorage.getItem('carrito');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartIndicator();
  }

  function showCart() {
    if (cart.length === 0) {
      Swal.fire('Tu carrito está vacío');
      return;
    }

    const summary = cart.map(p => `${p.name} - $${p.price}`).join('<br>');
    const total = cart.reduce((acc, p) => acc + p.price, 0);

    Swal.fire({
      title: 'Tu carrito',
      html: `
        <p>${summary}</p>
        <p><strong>Total:</strong> $${total}</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Finalizar compra',
      cancelButtonText: 'Seguir comprando'
    }).then(result => {
      if (result.isConfirmed) {
        showCheckoutForm();
      }
    });
  }

  viewCartBtn.addEventListener('click', showCart);
  viewCartIconBtn.addEventListener('click', showCart);

  clearCartBtn.addEventListener('click', () => {
    cart = [];
    localStorage.removeItem('carrito');
    updateCartIndicator();
  });

  window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    cart.push(product);
    localStorage.setItem('carrito', JSON.stringify(cart));
    updateCartIndicator();
  };
}

function updateCartIndicator() {
  const cartCount = document.getElementById('cart-count');
  cartCount.textContent = cart.length;
}

function showCheckoutForm() {
  Swal.fire({
    title: 'Finalizar compra',
    html: `
      <input id="swal-nombre" class="swal2-input" placeholder="Nombre" required>
      <input id="swal-email" class="swal2-input" placeholder="Email" type="email" required>
      <input id="swal-direccion" class="swal2-input" placeholder="Dirección" required>
    `,
    confirmButtonText: 'Confirmar',
    focusConfirm: false,
    preConfirm: () => {
      const name = document.getElementById('swal-nombre').value.trim();
      const email = document.getElementById('swal-email').value.trim();
      const address = document.getElementById('swal-direccion').value.trim();

      if (!name || !email || !address) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { name, email, address };
    }
  }).then(data => {
    if (data.isConfirmed) {
      const summary = cart.map(p => `${p.name} - $${p.price}`).join('<br>');
      const total = cart.reduce((acc, p) => acc + p.price, 0);

      Swal.fire({
        title: 'Resumen de compra',
        html: `
          <p><strong>Cliente:</strong> ${data.value.name}</p>
          <p><strong>Email:</strong> ${data.value.email}</p>
          <p><strong>Dirección:</strong> ${data.value.address}</p>
          <hr>
          <p>${summary}</p>
          <p><strong>Total:</strong> $${total}</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar compra',
        cancelButtonText: 'Cancelar'
      }).then(confirm => {
        if (confirm.isConfirmed) {
          Swal.fire({
            icon: 'success',
            title: '¡Gracias por tu compra!',
            text: 'Tu pedido está siendo procesado.'
          });

          cart = [];
          localStorage.removeItem('carrito');
          updateCartIndicator();
        }
      });
    }
  });
}
