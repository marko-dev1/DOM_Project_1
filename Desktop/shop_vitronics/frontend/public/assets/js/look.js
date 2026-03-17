function searchProducts(query) {
    const productsGrid = document.getElementById("products-grid");
    const products = productsGrid.querySelectorAll(".product-card"); // or your actual product class
    const lowerQuery = query.toLowerCase().trim();

    // If no search query, show all products
    if (lowerQuery === "") {
        products.forEach(product => {
            product.style.display = "block";
        });
        document.getElementById("section-title").textContent = "All Products";
        return;
    }

    let matchCount = 0;

    // Filter products
    products.forEach(product => {
        const productName = product.dataset.name?.toLowerCase() || "";
        if (productName.includes(lowerQuery)) {
            product.style.display = "block";
            matchCount++;
        } else {
            product.style.display = "none";
        }
    });

    // Update section title
    const title = document.getElementById("section-title");
    if (matchCount > 0) {
        title.textContent = `Search Results for "${query}" (${matchCount})`;
    } else {
        title.textContent = `No results found for "${query}" please try another search`;
    }
}
