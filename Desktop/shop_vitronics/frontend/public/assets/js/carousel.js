

// class Carousel {
//     constructor() {
//         this.currentSlide = 0;
//         this.slides = document.querySelectorAll('.carousel-slide');
//         this.indicators = document.querySelectorAll('.indicator');
//         this.totalSlides = this.slides.length;
//         this.autoPlayInterval = null;

//         // Promo messages mapped to slides
//         this.messages = [
//             { text: "", subtext: "" },
//             // { text: "Exclusive Deals!", subtext: "Save more on top brands" },
//             // { text: "Limited Time Offer!", subtext: "Grab your discount now" },
//             // { text: "Flash Sale!", subtext: "Hurry! Ending soon" },
//             // { text: "Big Discounts!", subtext: "New arrivals on sale" },
//             // { text: "Hot Deals!", subtext: "Shop smart, save big" },
//             // { text: "Clearance Sale!", subtext: "Up to 70% off select items" }
//         ];

//         this.init();
//     }

//     init() {
//         // Event listeners
//         document.getElementById('prevBtn').addEventListener('click', () => this.prevSlide());
//         document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());

//         // Indicator click
//         this.indicators.forEach((indicator, index) => {
//             indicator.addEventListener('click', () => this.goToSlide(index));
//         });

//         // Autoplay & hover pause
//         const carousel = document.querySelector('.carousel');
//         carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
//         carousel.addEventListener('mouseleave', () => this.startAutoPlay());

//         // Initialize first slide
//         this.showSlide(0);
//         this.startAutoPlay();
//     }

//     showSlide(index) {
//         if (!this.slides.length) return;

//         if (index < 0) index = this.slides.length - 1;
//         if (index >= this.slides.length) index = 0;

//         // Reset slides & indicators
//         this.slides.forEach(slide => slide.classList.remove('active'));
//         if (this.indicators.length) this.indicators.forEach(i => i.classList.remove('active'));

//         // Activate new slide & indicator
//         const currentSlide = this.slides[index];
//         if (currentSlide) currentSlide.classList.add('active');
//         if (this.indicators[index]) this.indicators[index].classList.add('active');

//         // Update overlay message
//         // const overlay = currentSlide.querySelector('.carousel-overlay');
//         // if (overlay) {
//         //     const message = this.messages[index % this.messages.length];
//         //     overlay.innerHTML = `
//         //         <h2 class="overlay-text">${message.text}</h2>
//         //         <p class="overlay-subtext">${message.subtext}</p>
//         //     `;
//         // }

//         this.currentSlide = index;
//     }

//     nextSlide() {
//         this.showSlide(this.currentSlide + 1);
//     }

//     prevSlide() {
//         this.showSlide(this.currentSlide - 1);
//     }

//     goToSlide(index) {
//         this.showSlide(index);
//     }

//     startAutoPlay() {
//         this.stopAutoPlay();
//         this.autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
//     }

//     stopAutoPlay() {
//         if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     new Carousel();
// });
