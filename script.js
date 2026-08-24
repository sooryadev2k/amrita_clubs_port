// ========== Scroll Animations ==========
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    { threshold: 0.15 }
);

document.querySelectorAll('.about-card, .service-card').forEach((card) => {
    observer.observe(card);
});

// ========== Navbar scroll effect ==========
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.padding = '0.8rem 5%';
        navbar.style.background = 'rgba(10, 10, 15, 0.9)';
    } else {
        navbar.style.padding = '1.2rem 5%';
        navbar.style.background = 'rgba(10, 10, 15, 0.7)';
    }
});

// ========== Form Submit ==========
function handleSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const btn = event.target.querySelector('button');

    btn.textContent = `Thanks, ${name}! ✅`;
    btn.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';

    setTimeout(() => {
        btn.textContent = 'Send Message 🚀';
        btn.style.background = '';
        event.target.reset();
    }, 3000);
}

// ========== Smooth scroll for nav links ==========
document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
