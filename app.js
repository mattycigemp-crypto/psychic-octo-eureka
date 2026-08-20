// ===== NEON OVERDRIVE - THREE.JS LANDING PAGE =====

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ===== THREE.JS SETUP =====
const canvasContainer = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true 
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0a0f, 1);
canvasContainer.appendChild(renderer.domElement);

// ===== CAMERA POSITION =====
camera.position.z = 30;
camera.position.y = 10;

// ===== GEOMETRY GROUPS =====
const roadGroup = new THREE.Group();
const particleGroup = new THREE.Group();
const buildingGroup = new THREE.Group();
const neonRingGroup = new THREE.Group();
const speedLinesGroup = new THREE.Group();

scene.add(roadGroup);
scene.add(particleGroup);
scene.add(buildingGroup);
scene.add(neonRingGroup);
scene.add(speedLinesGroup);

// ===== CREATE SYNTHWAVE GRID ROAD =====
const roadGeometry = new THREE.PlaneGeometry(400, 800, 40, 80);
const roadMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0xff00ff) },
        color2: { value: new THREE.Color(0x00ffff) }
    },
    vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        
        void main() {
            vUv = uv;
            vec3 newPosition = position;
            
            // Create wave effect
            float elevation = sin(position.x * 0.1 + time * 0.5) * 2.0;
            elevation += sin(position.y * 0.05 + time * 0.3) * 3.0;
            vElevation = elevation;
            
            newPosition.z = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        
        void main() {
            // Grid pattern
            float gridX = step(0.95, fract(vUv.x * 20.0));
            float gridY = step(0.95, fract((vUv.y + time * 0.02) * 20.0));
            
            float grid = max(gridX, gridY);
            
            // Neon glow based on elevation
            float glow = smoothstep(-2.0, 5.0, vElevation);
            
            vec3 finalColor = mix(color1, color2, vUv.y + sin(time * 0.2) * 0.5);
            finalColor += vec3(glow * 0.5);
            
            float alpha = grid * 0.8 + glow * 0.2;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: false
});

const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.y = -5;
roadGroup.add(road);

// ===== CREATE PARTICLES =====
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;

const posArray = new Float32Array(particlesCount * 3);
const colorArray = new Float32Array(particlesCount * 3);
const sizeArray = new Float32Array(particlesCount);

const colors = [
    new THREE.Color(0xff00ff),
    new THREE.Color(0x00ffff),
    new THREE.Color(0x9d00ff),
    new THREE.Color(0x0080ff)
];

for (let i = 0; i < particlesCount; i++) {
    posArray[i * 3] = (Math.random() - 0.5) * 400;
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 400;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 200;
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    colorArray[i * 3] = color.r;
    colorArray[i * 3 + 1] = color.g;
    colorArray[i * 3 + 2] = color.b;
    
    sizeArray[i] = Math.random() * 2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
particleGroup.add(particlesMesh);

// ===== CREATE CYBERPUNK BUILDINGS =====
function createBuilding(x, z, height) {
    const geometry = new THREE.BoxGeometry(8, height, 8);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            neonColor: { value: new THREE.Color().setHSL(Math.random(), 1, 0.5) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float time;
            uniform vec3 neonColor;
            
            void main() {
                vec3 darkColor = vec3(0.05, 0.05, 0.1);
                
                // Window pattern
                float windows = step(0.7, sin(vUv.x * 20.0) * sin(vUv.y * 20.0));
                windows += step(0.8, sin(vUv.x * 30.0 + time) * cos(vUv.y * 25.0));
                
                // Neon edges
                float edgeX = step(0.95, vUv.x) + step(vUv.x, 0.05);
                float edgeY = step(0.95, vUv.y) + step(vUv.y, 0.05);
                float edges = edgeX + edgeY;
                
                vec3 finalColor = darkColor;
                finalColor += neonColor * windows * 0.8;
                finalColor += neonColor * edges * 1.5;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        transparent: true
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2 - 5, z);
    buildingGroup.add(building);
    
    return building;
}

// Generate city skyline
for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    const height = 20 + Math.random() * 80;
    
    if (Math.abs(x) > 30 || Math.abs(z) > 30) {
        createBuilding(x, z, height);
    }
}

// ===== CREATE NEON RINGS =====
function createNeonRing(radius, y, rotationX, color) {
    const geometry = new THREE.TorusGeometry(radius, 0.3, 16, 100);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            glowColor: { value: new THREE.Color(color) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float time;
            uniform vec3 glowColor;
            
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                float pulse = sin(time * 2.0) * 0.3 + 0.7;
                vec3 finalColor = glowColor * intensity * pulse;
                gl_FragColor = vec4(finalColor, intensity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.y = y;
    ring.rotation.x = rotationX;
    neonRingGroup.add(ring);
    
    return ring;
}

const rings = [];
rings.push(createNeonRing(40, 20, Math.PI / 3, 0xff00ff));
rings.push(createNeonRing(55, 35, Math.PI / 4, 0x00ffff));
rings.push(createNeonRing(70, 50, Math.PI / 6, 0x9d00ff));

// ===== CREATE SPEED LINES =====
function createSpeedLine() {
    const geometry = new THREE.BufferGeometry();
    const length = 100;
    const positions = new Float32Array([
        0, 0, 0,
        0, length, 0
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const line = new THREE.Line(geometry, material);
    line.position.x = (Math.random() - 0.5) * 200;
    line.position.z = (Math.random() - 0.5) * 200;
    line.position.y = -20;
    line.rotation.x = Math.random() * Math.PI;
    speedLinesGroup.add(line);
    
    return line;
}

const speedLines = [];
for (let i = 0; i < 100; i++) {
    speedLines.push(createSpeedLine());
}

// ===== LIGHTING =====
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0xff00ff, 2, 100);
pointLight1.position.set(20, 30, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00ffff, 2, 100);
pointLight2.position.set(-20, 30, -20);
scene.add(pointLight2);

// ===== MOUSE INTERACTION =====
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
});

// ===== SCROLL INTERACTION =====
let scrollY = 0;

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// ===== ANIMATION LOOP =====
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();
    
    // Update shader uniforms
    roadMaterial.uniforms.time.value = elapsedTime;
    buildingGroup.children.forEach(building => {
        building.material.uniforms.time.value = elapsedTime;
    });
    rings.forEach(ring => {
        ring.material.uniforms.time.value = elapsedTime;
    });
    
    // Animate road
    road.position.y = -5 + Math.sin(elapsedTime * 0.5) * 2;
    
    // Animate particles
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.position.y = Math.sin(elapsedTime * 0.3) * 10;
    
    // Animate buildings
    buildingGroup.rotation.y = Math.sin(elapsedTime * 0.1) * 0.1;
    
    // Animate rings
    rings[0].rotation.z = elapsedTime * 0.2;
    rings[1].rotation.z = -elapsedTime * 0.15;
    rings[2].rotation.z = elapsedTime * 0.1;
    
    // Animate speed lines
    speedLines.forEach((line, index) => {
        line.position.y = -20 + Math.sin(elapsedTime * 2 + index) * 30;
        line.scale.y = Math.sin(elapsedTime * 3 + index * 0.1) * 0.5 + 0.5;
    });
    
    // Smooth camera movement based on mouse
    targetX = mouseX * 50;
    targetY = mouseY * 50;
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (10 + targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    // Scroll-based camera movement
    const scrollTargetY = scrollY * 0.02;
    camera.position.z = 30 - scrollTargetY;
    camera.position.y = 10 + scrollTargetY * 0.5;
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// ===== RESIZE HANDLER =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        
        // Animate hero content after loading
        gsap.from('.glitch', {
            duration: 1.5,
            opacity: 0,
            scale: 0.8,
            ease: 'power4.out',
            delay: 0.5
        });
        
        gsap.from('.tagline', {
            duration: 1,
            opacity: 0,
            y: 30,
            ease: 'power3.out',
            delay: 1
        });
        
        gsap.from('.stat', {
            duration: 0.8,
            opacity: 0,
            y: 50,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 1.2
        });
        
        gsap.from('.btn-primary, .btn-secondary', {
            duration: 0.8,
            opacity: 0,
            y: 30,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 1.6
        });
    }, 2000);
});

// ===== NAVIGATION SCROLL EFFECT =====
const nav = document.getElementById('main-nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ===== VIDEO MODAL =====
const btnPlay = document.querySelector('.btn-play');
const videoModal = document.getElementById('video-modal');
const modalClose = document.querySelector('.modal-close');

if (btnPlay) {
    btnPlay.addEventListener('click', () => {
        videoModal.classList.add('active');
    });
}

if (modalClose) {
    modalClose.addEventListener('click', () => {
        videoModal.classList.remove('active');
    });
}

videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
        videoModal.classList.remove('active');
    }
});

// ===== VEHICLE SELECTOR =====
const vehicleBtns = document.querySelectorAll('.vehicle-btn');
const vehicleInfo = document.querySelector('.vehicle-info');

const vehicleData = {
    speedster: {
        name: 'SPEEDSTER CLASS',
        desc: 'Lightweight, agile, and built for pure speed. Perfect for technical tracks and tight corners.',
        stats: { speed: 95, handling: 90, durability: 40 }
    },
    tank: {
        name: 'TANK CLASS',
        desc: 'Heavy armor and devastating ramming power. Built to destroy everything in your path.',
        stats: { speed: 50, handling: 45, durability: 100 }
    },
    phantom: {
        name: 'PHANTOM CLASS',
        desc: 'Balanced performance with stealth capabilities. The perfect all-rounder for any situation.',
        stats: { speed: 75, handling: 80, durability: 70 }
    }
};

vehicleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        vehicleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const vehicleType = btn.dataset.vehicle;
        const data = vehicleData[vehicleType];
        
        if (data && vehicleInfo) {
            gsap.to(vehicleInfo, {
                duration: 0.3,
                opacity: 0,
                y: 20,
                onComplete: () => {
                    vehicleInfo.querySelector('.vehicle-name').textContent = data.name;
                    vehicleInfo.querySelector('.vehicle-desc').textContent = data.desc;
                    
                    const fills = vehicleInfo.querySelectorAll('.fill');
                    fills[0].style.width = `${data.stats.speed}%`;
                    fills[1].style.width = `${data.stats.handling}%`;
                    fills[2].style.width = `${data.stats.durability}%`;
                    
                    gsap.to(vehicleInfo, {
                        duration: 0.3,
                        opacity: 1,
                        y: 0
                    });
                }
            });
        }
    });
});

// ===== FEATURE CARDS ANIMATION =====
gsap.utils.toArray('.feature-card').forEach((card, index) => {
    ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => {
            gsap.from(card, {
                duration: 0.6,
                opacity: 0,
                y: 50,
                delay: index * 0.1,
                ease: 'power3.out'
            });
        }
    });
});

// ===== SECTION HEADERS ANIMATION =====
gsap.utils.toArray('.section-header').forEach(header => {
    ScrollTrigger.create({
        trigger: header,
        start: 'top 80%',
        onEnter: () => {
            gsap.from(header.querySelectorAll('h2, .divider'), {
                duration: 0.8,
                opacity: 0,
                y: 50,
                stagger: 0.2,
                ease: 'power3.out'
            });
        }
    });
});

// ===== TRACK CARDS ANIMATION =====
gsap.utils.toArray('.track-card').forEach((card, index) => {
    ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => {
            gsap.from(card, {
                duration: 0.6,
                opacity: 0,
                x: index % 2 === 0 ? -100 : 100,
                delay: index * 0.2,
                ease: 'power3.out'
            });
        }
    });
});

// ===== PREORDER BUTTON PARALLAX =====
const preorderBtn = document.querySelector('.btn-preorder');

if (preorderBtn) {
    document.addEventListener('mousemove', (e) => {
        const rect = preorderBtn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(preorderBtn, {
            duration: 0.3,
            x: x * 0.3,
            y: y * 0.3,
            ease: 'power2.out'
        });
    });
    
    preorderBtn.addEventListener('mouseleave', () => {
        gsap.to(preorderBtn, {
            duration: 0.5,
            x: 0,
            y: 0,
            ease: 'elastic.out(1, 0.5)'
        });
    });
}

// ===== NEWSLETTER FORM =====
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        if (email) {
            const button = newsletterForm.querySelector('button');
            const originalText = button.textContent;
            
            button.textContent = 'SUBSCRIBED!';
            button.style.background = 'linear-gradient(135deg, #00ff00, #00cc00)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                newsletterForm.querySelector('input').value = '';
            }, 2000);
        }
    });
}

// ===== GLITCH TEXT EFFECT ON HOVER =====
const glitchElements = document.querySelectorAll('.glitch, .neon-text');

glitchElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        gsap.to(el, {
            duration: 0.1,
            skewX: 20,
            repeat: 3,
            yoyo: true,
            ease: 'rough'
        });
    });
});

// ===== SOCIAL BUTTONS HOVER EFFECT =====
const socialBtns = document.querySelectorAll('.social-btn');

socialBtns.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        gsap.to(this, {
            duration: 0.3,
            scale: 1.1,
            ease: 'back.out(1.7)'
        });
    });
    
    btn.addEventListener('mouseleave', function() {
        gsap.to(this, {
            duration: 0.3,
            scale: 1,
            ease: 'power2.out'
        });
    });
});

// ===== PERFORMANCE OPTIMIZATION =====
// Reduce particle count on mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobile()) {
    particlesGeometry.setDrawRange(0, 2000);
    renderer.setPixelRatio(1);
}

// ===== CONSOLE EASTER EGG =====
console.log(`
%c🏁 NEON OVERDRIVE 🏁

%cYou found the developer console! 

The game is coming soon. Stay tuned for more updates.

%c#NoRules #NoLimits #PureChaos
`, 
    'font-size: 24px; font-weight: bold; color: #ff00ff;',
    'font-size: 14px; color: #00ffff;',
    'font-size: 12px; color: #9d00ff;'
);

console.log('%cDeveloped with ❤️ and lots of ☕', 'font-size: 12px; color: #ff6b6b;');
