// let currentPage = 1;
// const resultsPerPage = 50;

// displayProducts(products) {
//   const grid = document.getElementById('products-grid');
//   const loading = document.getElementById('loading');
//   const error = document.getElementById('error-message');
  
//   loading.style.display = 'none';
//   error.style.display = 'none';

//   if (products.length === 0) {
//     grid.innerHTML = `
//       <p class="no-products" style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
//         No products found in this category.
//       </p>`;
//     return;
//   }

//   // ✅ Pagination logic
//   const startIndex = (currentPage - 1) * resultsPerPage;
//   const endIndex = startIndex + resultsPerPage;
//   const paginatedProducts = products.slice(startIndex, endIndex);

//   grid.innerHTML = paginatedProducts.map(product => {
//     const imageUrl = product.image_url || '/uploads/default-product.jpg';

//     return `
//       <div class="product-card" data-name="${product.name.toLowerCase()}">
//           <div class="product-image-container" onclick="app.showProductDetail(${product.id})">
//               <img src="${imageUrl}"  
//                    alt="${product.name}" 
//                    class="product-image"
//                    onerror="this.onerror=null; this.src='/uploads/default-product.jpg'">
//               ${product.stock <= 0 ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
//           </div>
          
//           <div class="product-info">
//               <h3 class="product-name">${product.name}</h3>
//               <div class="product-price">Ksh ${parseFloat(product.price).toFixed(2)}</div>
//               <p class="product-description">
//                 ${product.description ? product.description.substring(0, 100) + '...' : 'No description available'}
//               </p>
//               <div class="stock-info ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
//                   ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
//               </div>
//           </div> 
          
//           <div class="add-to-cart-info">
//               <button class="add-to-cart-btn" title="Add to cart"
//                   onclick="app.addToCartFromButton(${product.id})"
//                   ${product.stock <= 0 ? 'disabled' : ''}>
//                   🛒
//               </button>
//           </div>
//       </div>
//     `;
//   }).join('');

//   // ✅ Render pagination controls below grid
//   this.renderPaginationControls(products.length);
// }
// //controls


// renderPaginationControls(totalProducts) {
//   const paginationContainer = document.getElementById('pagination');
//   if (!paginationContainer) return;

//   paginationContainer.innerHTML = '';
//   const totalPages = Math.ceil(totalProducts / resultsPerPage);

//   // Previous button
//   const prevBtn = document.createElement('button');
//   prevBtn.textContent = 'Previous';
//   prevBtn.disabled = currentPage === 1;
//   prevBtn.onclick = () => {
//     if (currentPage > 1) {
//       currentPage--;
//       this.displayProducts(this.products);
//     }
//   };
//   paginationContainer.appendChild(prevBtn);

//   // Page buttons
//   for (let i = 1; i <= totalPages; i++) {
//     const pageBtn = document.createElement('button');
//     pageBtn.textContent = i;
//     if (i === currentPage) pageBtn.classList.add('active');
//     pageBtn.onclick = () => {
//       currentPage = i;
//       this.displayProducts(this.products);
//     };
//     paginationContainer.appendChild(pageBtn);
//   }

//   // Next button
//   const nextBtn = document.createElement('button');
//   nextBtn.textContent = 'Next';
//   nextBtn.disabled = currentPage === totalPages;
//   nextBtn.onclick = () => {
//     if (currentPage < totalPages) {
//       currentPage++;
//       this.displayProducts(this.products);
//     }
//   };
//   paginationContainer.appendChild(nextBtn);
// }

// //html

// <div id="products-grid" class="products-grid"></div>
// <div id="pagination" class="pagination"></div>


// //css
// .pagination {
//   display: flex;
//   gap: 8px;
//   justify-content: center;
//   margin: 20px 0;
// }

// .pagination button {
//   padding: 6px 12px;
//   border: none;
//   background: #eee;
//   border-radius: 4px;
//   cursor: pointer;
//   transition: background 0.2s ease;
// }

// .pagination button.active {
//   background: #3f37c9;
//   color: white;
//   font-weight: bold;
// }

// .pagination button:hover:not(:disabled) {
//   background: #ddd;
// }

// .pagination button:disabled {
//   opacity: 0.5;
//   cursor: not-allowed;
// }
