// Umut Bağı Platformu - İstemci Tarafı JavaScript Mantığı

document.addEventListener("DOMContentLoaded", () => {
    // Mobil Menü Yönetimi
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // Oturum Durumunu Yükle
    updateAuthUI();

    // Eğer listings sayfasındaysak ilanları yükle
    if (window.location.pathname === "/listings-view") {
        loadListings();
        setupListingForm();
        setupVerificationForm();
    }

    // Eğer auth sayfasındaysak form kontrollerini kur
    if (window.location.pathname === "/auth/view") {
        setupAuthForms();
    }
});

// --- TOAST BİLDİRİM SİSTEMİ ---
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "danger") {
        icon = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === "warning") {
        icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    }

    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // 4 saniye sonra otomatik sil
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);

    toast.addEventListener("click", () => toast.remove());
}

// --- OTURUM YÖNETİMİ ---
function getLoggedInUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

function updateAuthUI() {
    const user = getLoggedInUser();
    const authNavItem = document.getElementById("auth-nav-item");
    const userNavItem = document.getElementById("user-nav-item");
    
    if (user) {
        if (authNavItem) authNavItem.style.display = "none";
        if (userNavItem) {
            userNavItem.style.display = "flex";
            const usernameEl = document.getElementById("nav-username");
            const roleEl = document.getElementById("nav-role-badge");
            const userInfoContainer = userNavItem.querySelector(".user-info");
            
            if (usernameEl) usernameEl.textContent = user.name;
            if (roleEl) {
                roleEl.textContent = user.role === "disabled" ? "Engelli" : "Donör";
                roleEl.className = `badge badge-${user.role}`;
                
                // Eski onay rozetini temizle ve varsa yeniden ekle
                const oldVerified = userInfoContainer.querySelector(".badge-verified");
                if (oldVerified) oldVerified.remove();
                
                if (user.is_verified) {
                    const verifiedBadge = document.createElement("span");
                    verifiedBadge.className = "badge-verified";
                    verifiedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Onaylı';
                    userInfoContainer.appendChild(verifiedBadge);
                }
            }
        }
    } else {
        if (authNavItem) authNavItem.style.display = "block";
        if (userNavItem) userNavItem.style.display = "none";
    }
}

function logout() {
    localStorage.removeItem("user");
    showToast("Başarıyla çıkış yapıldı.");
    updateAuthUI();
    setTimeout(() => {
        window.location.href = "/";
    }, 1000);
}

// --- AUTH (GİRİŞ/KAYIT) SAYFASI İŞLEMLERİ ---
function setupAuthForms() {
    const loginTab = document.getElementById("tab-login");
    const registerTab = document.getElementById("tab-register");
    const loginForm = document.getElementById("form-login");
    const registerForm = document.getElementById("form-register");
    const registerRole = document.getElementById("register-role");
    const disabilityGroup = document.getElementById("disability-group");

    if (loginTab && registerTab) {
        loginTab.addEventListener("click", () => {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            loginForm.style.display = "block";
            registerForm.style.display = "none";
        });

        registerTab.addEventListener("click", () => {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            registerForm.style.display = "block";
            loginForm.style.display = "none";
        });
    }

    if (registerRole && disabilityGroup) {
        registerRole.addEventListener("change", (e) => {
            if (e.target.value === "disabled") {
                disabilityGroup.style.display = "block";
                document.getElementById("register-disability").setAttribute("required", "required");
            } else {
                disabilityGroup.style.display = "none";
                document.getElementById("register-disability").removeAttribute("required");
            }
        });
    }

    // Giriş Submit
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value;

            try {
                const response = await fetch("/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    showToast("Giriş başarılı! Yönlendiriliyorsunuz...");
                    updateAuthUI();
                    setTimeout(() => {
                        window.location.href = "/listings-view";
                    }, 1200);
                } else {
                    showToast(data.error || "Giriş başarısız.", "danger");
                }
            } catch (err) {
                showToast("Sunucu ile bağlantı kurulamadı.", "danger");
            }
        });
    }

    // Kayıt Submit
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("register-name").value;
            const email = document.getElementById("register-email").value;
            const role = document.getElementById("register-role").value;
            const disability_summary = document.getElementById("register-disability").value;

            const payload = { name, email, role };
            if (role === "disabled") {
                payload.disability_summary = disability_summary;
            }

            try {
                const response = await fetch("/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast("Kayıt başarılı! Giriş yapabilirsiniz.");
                    registerForm.reset();
                    // Giriş sekmesine geri dön
                    loginTab.click();
                } else {
                    showToast(data.error || "Kayıt başarısız.", "danger");
                }
            } catch (err) {
                showToast("Sunucu ile bağlantı kurulamadı.", "danger");
            }
        });
    }
}

// --- İLAN (LISTING) SAYFASI İŞLEMLERİ ---
let allListings = [];

async function loadListings() {
    const grid = document.getElementById("listings-grid");
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2xl" style="color: var(--secondary);"></i><p style="margin-top: 1rem; color: var(--text-muted);">İlanlar yükleniyor...</p></div>';

    try {
        const response = await fetch("/api/listings");
        allListings = await response.json();
        
        displayListings(allListings);
    } catch (err) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger);"><i class="fa-solid fa-triangle-exclamation fa-2xl"></i><p style="margin-top: 1rem;">İlanlar yüklenirken bir hata oluştu.</p></div>';
    }
}

function displayListings(listings) {
    const grid = document.getElementById("listings-grid");
    if (!grid) return;

    if (listings.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);"><i class="fa-solid fa-folder-open fa-2xl"></i><p style="margin-top: 1rem;">Henüz uygun ilan bulunmuyor.</p></div>';
        return;
    }

    const currentUser = getLoggedInUser();

    grid.innerHTML = listings.map(l => {
        let actionBtn = "";
        
        if (l.status === "open") {
            if (currentUser && currentUser.role === "donor") {
                actionBtn = `<button onclick="matchListing(${l.id})" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 1.25rem;"><i class="fa-solid fa-hand-holding-heart"></i> Destek Ol / Üstlen</button>`;
            } else if (!currentUser) {
                actionBtn = `<a href="/auth/view" class="btn btn-outline btn-sm" style="width: 100%; margin-top: 1.25rem; font-size: 0.8rem;"><i class="fa-solid fa-lock"></i> Destek Olmak İçin Giriş Yap</a>`;
            } else {
                actionBtn = `<div style="width: 100%; margin-top: 1.25rem; font-size: 0.85rem; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-info-circle"></i> Donör Eşleşmesi Bekleniyor</div>`;
            }
        } else {
            const donorName = l.matched_donor_name || "Bir Donör";
            actionBtn = `<div style="width: 100%; margin-top: 1.25rem; padding: 0.5rem; background: rgba(78, 205, 196, 0.08); border-radius: var(--radius-sm); font-size: 0.85rem; text-align: center; color: var(--secondary); border: 1px dashed rgba(78, 205, 196, 0.3);">
                <i class="fa-solid fa-circle-check"></i> ${donorName} tarafından üstlenildi
            </div>`;
        }

        // Akıllı Onay Rozeti ve Rapor Detayları
        let verifiedBadgeMarkup = "";
        if (l.creator_is_verified) {
            let details = "";
            if (l.creator_percentage && l.creator_group) {
                details = ` (%${l.creator_percentage} ${l.creator_group})`;
            }
            verifiedBadgeMarkup = `<span class="badge-verified" style="margin-left: 0.5rem;" title="e-Devlet & Sağlık Bakanlığı Rapor Onaylı"><i class="fa-solid fa-shield-check"></i> Onaylı${details}</span>`;
        }

        return `
            <article class="card">
                <div>
                    <div class="card-header">
                        <span class="card-category">${escapeHtml(l.category)}</span>
                        <span class="status-badge status-${l.status}">${l.status === 'open' ? 'Açık' : 'Eşleşti'}</span>
                    </div>
                    <h3 class="card-title">${escapeHtml(l.title)}</h3>
                    <p class="card-description">${escapeHtml(l.description)}</p>
                </div>
                <div>
                    <div class="card-footer" style="flex-wrap: wrap; gap: 0.5rem;">
                        <span class="card-meta" style="display: flex; align-items: center; flex-wrap: wrap;">
                            <i class="fa-solid fa-user" style="margin-right: 0.4rem;"></i> 
                            <strong>${escapeHtml(l.creator_name)}</strong>
                            ${verifiedBadgeMarkup}
                        </span>
                    </div>
                    ${actionBtn}
                </div>
            </article>
        `;
    }).join("");
}

function filterListings(category) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach(b => {
        if (b.getAttribute("data-category") === category) {
            b.classList.add("btn-primary");
            b.classList.remove("btn-outline");
        } else {
            b.classList.add("btn-outline");
            b.classList.remove("btn-primary");
        }
    });

    if (category === "all") {
        displayListings(allListings);
    } else {
        const filtered = allListings.filter(l => l.category.toLowerCase() === category.toLowerCase());
        displayListings(filtered);
    }
}

// İlan Eşleştirme (Destek Olma)
async function matchListing(listingId) {
    const user = getLoggedInUser();
    if (!user || user.role !== "donor") {
        showToast("Bu işlem için donör girişi yapmanız gerekmektedir.", "danger");
        return;
    }

    if (!confirm("Bu ilanı üstlenmek ve destek olmak istediğinizden emin misiniz?")) {
        return;
    }

    try {
        const response = await fetch(`/api/listings/${listingId}/match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donor_id: user.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast("Harika! İlanı başarıyla üstlendiniz, dayanışmanız için teşekkür ederiz.");
            loadListings();
        } else {
            showToast(data.error || "Eşleşme başarısız oldu.", "danger");
        }
    } catch (err) {
        showToast("Sunucu ile bağlantı hatası.", "danger");
    }
}

// Yeni İlan Oluşturma Formu Kontrolleri
function setupListingForm() {
    const openModalBtn = document.getElementById("btn-new-listing");
    const closeModalBtn = document.getElementById("btn-close-modal");
    const modalBackdrop = document.getElementById("new-listing-modal");
    const form = document.getElementById("form-new-listing");

    const user = getLoggedInUser();
    
    // Doğrulanmış engelli ise "Yeni İlan Aç" butonunu göster
    if (openModalBtn) {
        if (user && user.role === "disabled" && user.is_verified) {
            openModalBtn.style.display = "inline-flex";
        } else {
            openModalBtn.style.display = "none";
        }
    }

    if (openModalBtn && modalBackdrop) {
        openModalBtn.addEventListener("click", () => {
            modalBackdrop.classList.add("active");
        });
    }

    if (closeModalBtn && modalBackdrop) {
        closeModalBtn.addEventListener("click", () => {
            modalBackdrop.classList.remove("active");
        });
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove("active");
            }
        });
    }

    // Form Submit
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user || user.role !== "disabled") {
                showToast("Sadece engelli rolüne sahip kullanıcılar ilan açabilir.", "danger");
                return;
            }
            if (!user.is_verified) {
                showToast("İlan açmak için önce hesabınızı doğrulamanız gerekmektedir.", "danger");
                return;
            }

            const title = document.getElementById("listing-title").value;
            const category = document.getElementById("listing-category").value;
            const description = document.getElementById("listing-description").value;

            try {
                const response = await fetch("/api/listings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        category,
                        description,
                        created_by: user.id
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast("İhtiyaç ilanınız başarıyla oluşturuldu.");
                    form.reset();
                    modalBackdrop.classList.remove("active");
                    loadListings();
                } else {
                    showToast(data.error || "İlan oluşturulamadı.", "danger");
                }
            } catch (err) {
                showToast("Sunucu ile bağlantı hatası.", "danger");
            }
        });
    }
}

// --- e-DEVLET PDF BELGE DOĞRULAMA FORMU KONTROLLERİ ---
function setupVerificationForm() {
    const banner = document.getElementById("verification-banner");
    const form = document.getElementById("form-verify-report");
    const fileInput = document.getElementById("report-file");
    const fileNameSpan = document.getElementById("selected-file-name");
    
    const user = getLoggedInUser();
    
    // Kullanıcı engelli ise ve doğrulanmamışsa bannerı göster
    if (banner) {
        if (user && user.role === "disabled" && !user.is_verified) {
            banner.style.display = "flex";
        } else {
            banner.style.display = "none";
        }
    }

    if (fileInput && fileNameSpan) {
        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                fileNameSpan.textContent = e.target.files[0].name;
            } else {
                fileNameSpan.textContent = "Dosya seçilmedi";
            }
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const user = getLoggedInUser();
            if (!user) {
                showToast("Lütfen önce giriş yapın.", "danger");
                return;
            }

            if (fileInput.files.length === 0) {
                showToast("Lütfen doğrulanacak PDF raporunuzu seçin.", "danger");
                return;
            }

            const formData = new FormData();
            formData.append("report", fileInput.files[0]);
            formData.append("user_id", user.id);

            // Toast bildirim yükleniyor mesajı
            showToast("Belge okunuyor ve doğrulama sorgusu yapılıyor, lütfen bekleyin...", "warning");

            try {
                const response = await fetch("/auth/verify-report", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message || "Hesabınız başarıyla doğrulandı!");
                    
                    // Oturum durumunu güncelle
                    localStorage.setItem("user", JSON.stringify(data.user));
                    
                    // Arayüz elemanlarını güncelle
                    updateAuthUI();
                    setupListingForm();
                    
                    if (banner) banner.style.display = "none";
                    
                    // İlanları yeniden yükle ki ismimizin yanındaki rozet güncellensin
                    loadListings();
                } else {
                    showToast(data.error || "Rapor doğrulanamadı. Lütfen geçerli bir e-Devlet PDF'i yükleyin.", "danger");
                }
            } catch (err) {
                showToast("Doğrulama servisine bağlanılamadı.", "danger");
            }
        });
    }
}

// XSS Koruması için HTML Kaçış (Helper)
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
