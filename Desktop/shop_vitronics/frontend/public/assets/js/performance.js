// /**
//  * Performance & Loading Optimization Utility
//  * Handles lazy loading, image optimization, and loading states
//  */

// class PerformanceOptimizer {
//     constructor() {
//         this.progressBar = null;
//         this.imagesLoading = 0;
//         this.init();
//     }

//     init() {
//         this.setupProgressBar();
//         this.setupLazyLoading();
//         this.setupImageOptimization();
//         this.setupNetworkDetection();
//     }

//     /**
//      * Setup progress bar for page loads
//      */
//     setupProgressBar() {
//         const container = document.createElement('div');
//         container.className = 'progress-bar-container';
//         container.innerHTML = '<div class="progress-bar"></div>';
//         document.body.insertAdjacentElement('afterbegin', container);
//         this.progressBar = container;
//     }

//     /**
//      * Show loading progress bar with animation
//      */
//     showProgress() {
//         if (this.progressBar) {
//             this.progressBar.classList.add('active');
//             const bar = this.progressBar.querySelector('.progress-bar');
            
//             // Reset and start animation
//             bar.style.width = '0%';
//             let progress = 0;
            
//             const interval = setInterval(() => {
//                 progress += Math.random() * 30;
//                 if (progress > 95) progress = 95;
//                 bar.style.width = progress + '%';
//             }, 300);
            
//             // Store interval for later clearing
//             bar.dataset.progressInterval = interval;
//         }
//     }

//     /**
//      * Hide loading progress bar with completion
//      */
//     hideProgress() {
//         if (this.progressBar) {
//             const bar = this.progressBar.querySelector('.progress-bar');
//             bar.style.width = '100%';
            
//             // Clear interval
//             if (bar.dataset.progressInterval) {
//                 clearInterval(parseInt(bar.dataset.progressInterval));
//             }
            
//             // Hide after completion
//             setTimeout(() => {
//                 this.progressBar.classList.remove('active');
//             }, 300);
//         }
//     }

//     /**
//      * Setup lazy loading for images
//      */
//     setupLazyLoading() {
//         if ('IntersectionObserver' in window) {
//             const imageObserver = new IntersectionObserver((entries, observer) => {
//                 entries.forEach(entry => {
//                     if (entry.isIntersecting) {
//                         const img = entry.target;
                        
//                         // Set loading state
//                         img.classList.add('loading');
                        
//                         // Use data-src for lazy loading
//                         if (img.dataset.src) {
//                             const actualSrc = img.dataset.src;
                            
//                             // Create temporary image to preload
//                             const tempImg = new Image();
//                             tempImg.onload = () => {
//                                 img.src = actualSrc;
//                                 img.classList.remove('loading');
//                                 img.classList.add('loaded', 'fade-in');
//                                 observer.unobserve(img);
//                             };
                            
//                             tempImg.onerror = () => {
//                                 console.warn('Image failed to load:', actualSrc);
//                                 img.classList.remove('loading');
//                                 observer.unobserve(img);
//                             };
                            
//                             tempImg.src = actualSrc;
//                         } else if (img.src) {
//                             // Image already has src, mark as loaded
//                             img.classList.remove('loading');
//                             img.classList.add('loaded');
//                             observer.unobserve(img);
//                         }
//                     }
//                 });
//             }, {
//                 rootMargin: '50px' // Start loading 50px before image enters viewport
//             });

//             // Observe all product images
//             document.querySelectorAll('[data-src], .product-image, .modal-image').forEach(img => {
//                 imageObserver.observe(img);
//             });

//             // Re-observe images when DOM changes (e.g., product filtering)
//             window.addEventListener('productCardsUpdated', () => {
//                 document.querySelectorAll('[data-src], .product-image, .modal-image').forEach(img => {
//                     if (!img.classList.contains('loaded') && !img.src) {
//                         imageObserver.observe(img);
//                     }
//                 });
//             });
//         } else {
//             // Fallback for older browsers
//             this.fallbackLazyLoading();
//         }
//     }

//     /**
//      * Fallback lazy loading for older browsers
//      */
//     fallbackLazyLoading() {
//         const images = document.querySelectorAll('[data-src]');
//         images.forEach(img => {
//             if (img.dataset.src) {
//                 img.src = img.dataset.src;
//             }
//         });
//     }

//     /**
//      * Setup image optimization and responsive images
//      */
//     setupImageOptimization() {
//         const images = document.querySelectorAll('img');
        
//         images.forEach(img => {
//             // Add loading attribute for native lazy loading
//             if (!img.hasAttribute('loading')) {
//                 img.setAttribute('loading', 'lazy');
//             }
            
//             // Ensure images have alt text for accessibility
//             if (!img.alt || img.alt.trim() === '') {
//                 img.alt = 'Product image';
//             }
            
//             // Add error handling
//             img.addEventListener('error', () => {
//                 img.classList.add('image-error');
//                 console.warn('Image failed to load:', img.src);
//             });
            
//             // Add loaded event listener
//             if (img.complete) {
//                 img.classList.add('loaded');
//             } else {
//                 img.addEventListener('load', function() {
//                     this.classList.add('loaded', 'fade-in');
//                 });
//             }
//         });
//     }

//     /**
//      * Setup network detection for adaptive loading
//      */
//     setupNetworkDetection() {
//         if ('connection' in navigator) {
//             const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
//             if (connection) {
//                 const updateNetworkStatus = () => {
//                     const effectiveType = connection.effectiveType;
//                     const saveData = connection.saveData;
                    
//                     document.documentElement.dataset.networkType = effectiveType;
//                     document.documentElement.dataset.saveData = saveData ? 'true' : 'false';
                    
//                     // Log network status for debugging
//                     console.log('Network type:', effectiveType, 'Save data:', saveData);
//                 };
                
//                 // Initial check
//                 updateNetworkStatus();
                
//                 // Listen for changes
//                 connection.addEventListener('change', updateNetworkStatus);
//             }
//         }
//     }

//     /**
//      * Show modal loader spinner
//      */
//     showModalLoader(modalSelector = '#productModal') {
//         const modal = document.querySelector(modalSelector);
//         if (!modal) return;
        
//         let loader = modal.querySelector('.modal-loader');
//         if (!loader) {
//             loader = document.createElement('div');
//             loader.className = 'modal-loader';
//             loader.innerHTML = `
//                 <div class="spinner"></div>
//                 <p>Loading content...</p>
//             `;
//             modal.appendChild(loader);
//         }
        
//         loader.classList.add('active');
        
//         // Hide modal content while loading
//         const content = modal.querySelector('#modal-content');
//         if (content) {
//             content.classList.remove('loaded');
//         }
//     }

//     /**
//      * Hide modal loader spinner
//      */
//     hideModalLoader(modalSelector = '#productModal') {
//         const modal = document.querySelector(modalSelector);
//         if (!modal) return;
        
//         const loader = modal.querySelector('.modal-loader');
//         if (loader) {
//             loader.classList.remove('active');
//         }
        
//         // Show modal content
//         const content = modal.querySelector('#modal-content');
//         if (content) {
//             content.classList.add('loaded', 'fade-in');
//         }
//     }

//     /**
//      * Show image loading state in modal
//      */
//     showImageLoader(imageContainer) {
//         const loader = document.createElement('div');
//         loader.className = 'image-loader';
//         loader.style.cssText = `
//             position: absolute;
//             top: 0;
//             left: 0;
//             width: 100%;
//             height: 100%;
//             z-index: 10;
//         `;
//         imageContainer.style.position = 'relative';
//         imageContainer.appendChild(loader);
//         return loader;
//     }

//     /**
//      * Hide image loading state
//      */
//     hideImageLoader(loader) {
//         if (loader && loader.parentNode) {
//             loader.parentNode.removeChild(loader);
//         }
//     }

//     /**
//      * Preload an image and return promise
//      */
//     preloadImage(src) {
//         return new Promise((resolve, reject) => {
//             const img = new Image();
            
//             img.onload = () => {
//                 resolve(src);
//             };
            
//             img.onerror = () => {
//                 reject(new Error(`Failed to load image: ${src}`));
//             };
            
//             img.src = src;
//         });
//     }

//     /**
//      * Batch preload multiple images
//      */
//     preloadImages(srcArray) {
//         return Promise.all(srcArray.map(src => this.preloadImage(src)));
//     }

//     /**
//      * Request animation frame wrapper for smooth animations
//      */
//     smoothLoad(callback, delay = 0) {
//         return new Promise((resolve) => {
//             setTimeout(() => {
//                 requestAnimationFrame(() => {
//                     callback();
//                     resolve();
//                 });
//             }, delay);
//         });
//     }

//     /**
//      * Cache API calls with localStorage
//      */
//     cacheApiCall(key, asyncFunction, expirationMinutes = 30) {
//         const cacheKey = `api_cache_${key}`;
//         const cacheTime = `${cacheKey}_time`;
//         const now = Date.now();
        
//         // Check if cache exists and is valid
//         const cached = localStorage.getItem(cacheKey);
//         const cacheTimestamp = localStorage.getItem(cacheTime);
        
//         if (cached && cacheTimestamp) {
//             const age = (now - parseInt(cacheTimestamp)) / 1000 / 60; // in minutes
//             if (age < expirationMinutes) {
//                 console.log(`Using cached data for: ${key}`);
//                 return Promise.resolve(JSON.parse(cached));
//             }
//         }
        
//         // Fetch new data
//         return asyncFunction().then(data => {
//             localStorage.setItem(cacheKey, JSON.stringify(data));
//             localStorage.setItem(cacheTime, now.toString());
//             return data;
//         });
//     }

//     /**
//      * Debounce function calls
//      */
//     debounce(func, wait) {
//         let timeout;
//         return function executedFunction(...args) {
//             const later = () => {
//                 clearTimeout(timeout);
//                 func(...args);
//             };
//             clearTimeout(timeout);
//             timeout = setTimeout(later, wait);
//         };
//     }

//     /**
//      * Throttle function calls
//      */
//     throttle(func, limit) {
//         let inThrottle;
//         return function(...args) {
//             if (!inThrottle) {
//                 func.apply(this, args);
//                 inThrottle = true;
//                 setTimeout(() => inThrottle = false, limit);
//             }
//         };
//     }

//     /**
//      * Enable resource hints for better performance
//      */
//     setupResourceHints() {
//         // Preconnect to API domain
//         const preconnect = document.createElement('link');
//         preconnect.rel = 'preconnect';
//         preconnect.href = window.location.origin;
//         document.head.appendChild(preconnect);
        
//         // DNS-prefetch for external resources
//         const dnsPrefetch = document.createElement('link');
//         dnsPrefetch.rel = 'dns-prefetch';
//         dnsPrefetch.href = 'https://cdn.jsdelivr.net';
//         document.head.appendChild(dnsPrefetch);
//     }
// }

// // Initialize performance optimizer when DOM is ready
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//         window.performance_optimizer = new PerformanceOptimizer();
//     });
// } else {
//     window.performance_optimizer = new PerformanceOptimizer();
// }
