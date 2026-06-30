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
    if (window.location.pathname.includes("/auth/view") || window.location.pathname.includes("/auth")) {
        console.log("Auth sayfasi algilandi, formlar kuruluyor...");
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
    const adminNavItem = document.getElementById("admin-nav-item");
    
    if (user) {
        if (authNavItem) authNavItem.style.display = "none";
        if (adminNavItem && user.role === 'admin') adminNavItem.style.display = "block";
        if (userNavItem) {
            userNavItem.style.display = "flex";
            const usernameEl = document.getElementById("nav-username");
            const roleEl = document.getElementById("nav-role-badge");
            const userInfoContainer = userNavItem.querySelector(".user-info");
            
            if (usernameEl) usernameEl.textContent = user.name;
            if (roleEl) {
                if (user.role === "admin") {
                    roleEl.textContent = "YÖNETİCİ";
                } else {
                    roleEl.textContent = user.role === "disabled" ? "İhtiyaç Sahibi" : "Bağışçı";
                }
                roleEl.className = `badge badge-${user.role}`;
                
                // Eski onay ve puan rozetlerini temizle
                const oldVerified = userInfoContainer.querySelector(".badge-verified");
                if (oldVerified) oldVerified.remove();
                
                const oldPoints = userInfoContainer.querySelector(".badge-points");
                if (oldPoints) oldPoints.remove();
                
                if (user.is_verified) {
                    const verifiedBadge = document.createElement("span");
                    verifiedBadge.className = "badge-verified";
                    verifiedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Onaylı';
                    userInfoContainer.appendChild(verifiedBadge);
                }
                
                // Oyunlaştırma (Gamification) - İyilik Puanı Sadece Bağışçılara
                if (user.role === 'donor') {
                    const pts = user.goodness_points || 0;
                    let badgeClass = "badge-start";
                    let badgeName = "İyilik Başlangıcı";
                    
                    if (pts >= 150) { 
                        badgeClass = "badge-gold"; 
                        badgeName = "İyilik Meleği"; 
                    } else if (pts >= 50) { 
                        badgeClass = "badge-bronze"; 
                        badgeName = "Umut Elçisi"; 
                    }
                    
                    const pointsBadge = document.createElement("span");
                    pointsBadge.className = `badge-points ${badgeClass}`;
                    pointsBadge.innerHTML = `<i class="fa-solid fa-star"></i> ${pts} Puan - ${badgeName}`;
                    userInfoContainer.appendChild(pointsBadge);
                }
            }
            // Eğer kullanıcı bağışçıysa, "Diğer İlanlar" butonunun adını "Umut Bekleyenler" olarak değiştir.
            const otherNeedsText = document.getElementById("other-needs-text");
            if (otherNeedsText) {
                if (user.role === "donor") {
                    otherNeedsText.textContent = "Umut Bekleyenler";
                } else {
                    otherNeedsText.textContent = "Diğer İlanlar";
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
                const response = await fetch("/api/auth/login", {
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
                const response = await fetch("/api/auth/register", {
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

async function loadListings(silent = false) {
    const grid = document.getElementById("listings-grid");
    if (!grid) return;

    if (!silent) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2xl" style="color: var(--secondary);"></i><p style="margin-top: 1rem; color: var(--text-muted);">İlanlar yükleniyor...</p></div>';
    }

    try {
        const response = await fetch("/api/listings");
        const freshListings = await response.json();
        
        // Eğer sessiz yenileme yapılıyorsa ve veri değişmemişse arayüzü boşuna yenileme (flicker olmaması için)
        if (silent && JSON.stringify(allListings) === JSON.stringify(freshListings)) {
            return;
        }
        
        allListings = freshListings;
        if (typeof applyFilters === "function") {
            applyFilters();
        } else {
            displayListings(allListings);
        }
    } catch (err) {
        if (!silent) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger);"><i class="fa-solid fa-triangle-exclamation fa-2xl"></i><p style="margin-top: 1rem;">İlanlar yüklenirken bir hata oluştu.</p></div>';
        }
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
            // BAĞIŞ İLANI ise
            if (l.listing_type === "donation") {
                if (currentUser && currentUser.role === "disabled") {
                    if (currentUser.is_verified) {
                        actionBtn = `
                        <button onclick="matchListing(${l.id})" class="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-2 rounded-xl active:scale-95 transition-transform duration-200 shadow-sm text-sm sm:text-base">
                          <span class="text-lg">🤝</span>
                          <span>İhtiyacım Var (Talep Et)</span>
                        </button>
                        `;
                    } else {
                        actionBtn = `<div class="w-full text-center bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 text-sm border border-orange-200"><i class="fa-solid fa-shield-halved"></i> Talep Etmek İçin Raporunuzu Doğrulayın</div>`;
                    }
                } else if (currentUser && currentUser.role === "donor") {
                    if (currentUser.id === l.created_by) {
                        actionBtn = `
                        <div class="w-full text-center text-gray-500 font-medium py-2 text-sm mb-2"><i class="fa-solid fa-info-circle"></i> İhtiyaç Sahibinin Talebi Bekleniyor</div>
                        <div class="flex justify-end mt-1">
                            <button onclick="deleteListing(${l.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3 rounded-lg transition-colors text-xs border border-red-200"><i class="fa-solid fa-trash"></i> Bağış İlanını Kaldır</button>
                        </div>
                        `;
                    } else {
                        actionBtn = `<div class="w-full text-center text-gray-500 font-medium py-2 text-sm"><i class="fa-solid fa-info-circle"></i> İhtiyaç Sahibinin Talebi Bekleniyor</div>`;
                    }
                } else {
                    actionBtn = `<a href="/auth/view" class="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 text-sm"><i class="fa-solid fa-lock"></i> Talep Etmek İçin Giriş Yap</a>`;
                }
            } 
            // İHTİYAÇ İLANI ise
            else if (l.listing_type === "need") {
                if (currentUser && currentUser.role === "donor") {
                    actionBtn = `
                    <div class="flex flex-col sm:flex-row gap-2 w-full">
                        <button onclick="matchListing(${l.id}, 'donate')" class="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-1 rounded-xl active:scale-95 transition-transform duration-200 shadow-sm text-sm">
                            <span class="text-lg">📦</span>
                            <span>Elindekini Bağışla</span>
                        </button>
                        <button onclick="matchListing(${l.id}, 'purchase')" class="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-1 rounded-xl active:scale-95 transition-transform duration-200 shadow-sm text-sm">
                            <span class="text-lg">🛒</span>
                            <span>Üstlen (Satın Al)</span>
                        </button>
                    </div>
                    `;
                } else if (currentUser && currentUser.role === "disabled") {
                    if (currentUser.id === l.created_by) {
                        actionBtn = `
                        <div class="w-full text-center text-gray-500 font-medium py-2 text-sm mb-2"><i class="fa-solid fa-info-circle"></i> Bağışçının Desteği Bekleniyor</div>
                        <div class="flex justify-end mt-1">
                            <button onclick="deleteListing(${l.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3 rounded-lg transition-colors text-xs border border-red-200"><i class="fa-solid fa-trash"></i> Talebimi Kaldır</button>
                        </div>
                        `;
                    } else {
                        actionBtn = `<div class="w-full text-center text-gray-500 font-medium py-2 text-sm"><i class="fa-solid fa-info-circle"></i> Bağışçının Desteği Bekleniyor</div>`;
                    }
                } else {
                    actionBtn = `<a href="/auth/view" class="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200 text-sm"><i class="fa-solid fa-lock"></i> Destek Olmak İçin Giriş Yap</a>`;
                }
            }
        } else {
            const donorName = l.matched_donor_name || "Bir Üye";
            if (l.listing_type === "donation") {
                const isCreator = currentUser && currentUser.id === l.created_by;
                const isMatchedUser = currentUser && currentUser.id === l.matched_donor_id; // disabled user who claimed it
                if (isCreator && l.claimer_name) {
                    actionBtn = `
                    <div class="flex-1 w-full bg-teal-50 p-4 rounded-xl border border-teal-200 mt-2">
                        <div class="text-sm font-bold text-teal-800 mb-2 border-b border-teal-200 pb-1"><i class="fa-solid fa-address-book"></i> Talep Edenin İletişim Bilgileri</div>
                        <p class="text-xs text-teal-900 mb-1"><strong><i class="fa-solid fa-user text-teal-600 w-4"></i></strong> ${escapeHtml(l.claimer_name)}</p>
                        <p class="text-xs text-teal-900 mb-1"><strong><i class="fa-solid fa-phone text-teal-600 w-4"></i></strong> ${escapeHtml(l.claimer_phone)}</p>
                        <p class="text-xs text-teal-900"><strong><i class="fa-solid fa-map-location-dot text-teal-600 w-4"></i></strong> ${escapeHtml(l.claimer_address)}</p>
                    </div>`;
                } else if (isMatchedUser) {
                    actionBtn = `
                    <div class="w-full text-center bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium py-2 rounded-xl text-sm mb-2"><i class="fa-solid fa-circle-check"></i> Bu ilanı siz talep ettiniz.</div>
                    <div class="flex justify-end mt-1">
                        <button onclick="cancelMatch(${l.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3 rounded-lg transition-colors text-xs border border-red-200"><i class="fa-solid fa-xmark"></i> Talebimi İptal Et</button>
                    </div>
                    `;
                } else {
                    actionBtn = `<div class="w-full text-center bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium py-2 rounded-xl text-sm"><i class="fa-solid fa-circle-check"></i> ${donorName} isimli üyeye rezerve edildi</div>`;
                }
            } else {
                const isMatchedDonor = currentUser && currentUser.id === l.matched_donor_id;
                if (isMatchedDonor) {
                    actionBtn = `
                    ${l.contact_phone ? `
                    <div class="flex-1 w-full bg-blue-50 p-4 rounded-xl border border-blue-200 mt-2 mb-2">
                        <div class="text-sm font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1"><i class="fa-solid fa-address-book"></i> İhtiyaç Sahibinin İletişim Bilgileri</div>
                        <p class="text-xs text-blue-900 mb-1"><strong><i class="fa-solid fa-user text-blue-600 w-4"></i></strong> ${escapeHtml(l.creator_name)}</p>
                        <p class="text-xs text-blue-900 mb-1"><strong><i class="fa-solid fa-phone text-blue-600 w-4"></i></strong> ${escapeHtml(l.contact_phone)}</p>
                        <p class="text-xs text-blue-900"><strong><i class="fa-solid fa-map-location-dot text-blue-600 w-4"></i></strong> ${escapeHtml(l.contact_address)}</p>
                    </div>` : `<div class="w-full text-center bg-blue-50 text-blue-600 border border-blue-200 font-medium py-2 rounded-xl text-sm mb-2"><i class="fa-solid fa-circle-check"></i> Bu ihtiyacı siz üstlendiniz.</div>`}
                    <div class="flex justify-end mt-1">
                        <button onclick="cancelMatch(${l.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 px-3 rounded-lg transition-colors text-xs border border-red-200"><i class="fa-solid fa-xmark"></i> İşlemi İptal Et</button>
                    </div>
                    `;
                } else {
                    actionBtn = `<div class="w-full text-center bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium py-2 rounded-xl text-sm"><i class="fa-solid fa-hand-holding-heart"></i> Bu ihtiyaç ${donorName} tarafından karşılandı</div>`;
                }
            }
        }

        // Akıllı Onay Rozeti ve Rapor Detayları
        let verifiedBadgeMarkup = "";
        if (l.creator_is_verified) {
            let details = "";
            if (l.creator_percentage && l.creator_group) {
                details = ` (%${l.creator_percentage} ${l.creator_group})`;
            }
            verifiedBadgeMarkup = `
            <div class="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium" title="e-Devlet & Sağlık Bakanlığı Rapor Onaylı">
              <i class="fa-solid fa-circle-check"></i>
              <span>Onaylı${details}</span>
            </div>`;
        }

        // Resim varsa
        let imageMarkup = "";
        if (l.image_url) {
            imageMarkup = `<img src="/static/${l.image_url}" alt="İlan Görseli" class="w-full h-48 object-cover border-b border-gray-100">`;
        }

        let cardBorderColor = l.listing_type === 'need' ? 'border-orange-200' : 'border-gray-100';
        let badgeType = l.listing_type === 'need' 
            ? `<span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wider"><i class="fa-solid fa-bullhorn mr-1"></i> İHTİYAÇ: ${escapeHtml(l.category)}</span>`
            : `<span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider"><i class="fa-solid fa-gift mr-1"></i> BAĞIŞ: ${escapeHtml(l.category)}</span>`;

        let locationMarkup = "";
        if (l.listing_type === 'need' && l.city && l.district) {
            locationMarkup = `<div class="text-xs text-orange-600 mt-2 flex items-center gap-1 font-medium"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(l.city)} / ${escapeHtml(l.district)}</div>`;
        }

        return `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border ${cardBorderColor} overflow-hidden flex flex-col h-full text-left">
              ${imageMarkup}
              <div class="p-5 flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  ${badgeType}
                  ${verifiedBadgeMarkup}
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  ${escapeHtml(l.title)}
                </h3>
                <p class="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                  ${escapeHtml(l.description)}
                </p>
                <div class="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-1">
                    <i class="fa-solid fa-user"></i> <strong>${escapeHtml(l.creator_name)}</strong>
                  </div>
                  ${locationMarkup}
                </div>
              </div>
              <div class="p-4 pt-0 mt-auto flex gap-3 w-full">
                ${actionBtn}
              </div>
            </div>
        `;
    }).join("");
}

let currentMainFilter = 'all';

function setMainFilter(filterType) {
    currentMainFilter = filterType;
    
    // Update button styles
    const buttons = document.querySelectorAll(".main-filter-btn");
    buttons.forEach(b => {
        if (b.getAttribute("data-filter") === filterType) {
            b.classList.add("ring-4", "shadow-md");
            if(filterType === 'my-listings') b.classList.add("border-blue-500");
            else if(filterType === 'other-needs') b.classList.add("border-orange-500");
            else if(filterType === 'donations') b.classList.add("border-teal-500");
            b.classList.remove("border-gray-200");
        } else {
            b.classList.remove("ring-4", "shadow-md", "border-blue-500", "border-orange-500", "border-teal-500");
            b.classList.add("border-gray-200");
        }
    });

    applyFilters();
}

function applyFilters() {
    let filtered = allListings;
    const currentUser = getLoggedInUser();

    if (currentMainFilter === 'my-listings') {
        if (!currentUser) {
            filtered = [];
        } else {
            filtered = allListings.filter(l => {
                // Kullanıcının kendi oluşturduğu tüm ilanlar (Bağışçının bağışları, Engellinin ihtiyaçları)
                if (l.created_by === currentUser.id) return true;
                
                // Bağışçı (donor), üstlendiği/karşıladığı "ihtiyaç" ilanlarını İlanlarım'da görebilsin
                if (currentUser.role === 'donor' && l.matched_donor_id === currentUser.id) return true;
                
                // Engelli bireyler (disabled), talep ettikleri bağışları İlanlarım'da görmeyecek (Paylaşım Merkezi'nde görecekler)
                return false;
            });
        }
    } else if (currentMainFilter === 'other-needs') {
        filtered = allListings.filter(l => l.listing_type === 'need');
        if (currentUser) {
            filtered = filtered.filter(l => l.created_by !== currentUser.id);
        }
    } else if (currentMainFilter === 'donations') {
        filtered = allListings.filter(l => l.listing_type === 'donation');
        if (currentUser) {
            // Kullanıcı kendi açtığı bağış ilanlarını Paylaşım Merkezi'nde görmesin
            filtered = filtered.filter(l => l.created_by !== currentUser.id);
        }
    }

    // Apply search filter if any
    const searchInput = document.getElementById("search-input");
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    if (query) {
        filtered = filtered.filter(l => 
            l.title.toLowerCase().includes(query) || 
            (l.description && l.description.toLowerCase().includes(query)) || 
            (l.category && l.category.toLowerCase().includes(query)) ||
            (l.creator_name && l.creator_name.toLowerCase().includes(query))
        );
    }

    displayListings(filtered);
}

function filterBySearch() {
    applyFilters();
}

// İlan Eşleştirme (Destek Olma)
async function matchListing(listingId, actionType = 'default') {
    const user = getLoggedInUser();
    
    // Hangi ilanı üstlendiğimizi bulalım (Bağış mı İhtiyaç mı)
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;

    if (listing.listing_type === "donation") {
        if (!user || user.role !== "disabled") {
            showToast("Bağış ilanlarını talep etmek için engelli üye girişi yapmanız gerekmektedir.", "danger");
            return;
        }
        if (!user.is_verified) {
            showToast("İlanı talep edebilmek için lütfen önce e-Devlet raporunuzu doğrulayın.", "danger");
            return;
        }
        
        // Eşleşme (Talep) modalını aç
        const claimModalBackdrop = document.getElementById("claim-modal");
        const claimListingId = document.getElementById("claim-listing-id");
        const claimName = document.getElementById("claim-name");
        
        if (claimModalBackdrop && claimListingId) {
            claimListingId.value = listingId;
            if (claimName) claimName.value = user.name;
            
            claimModalBackdrop.style.display = "flex";
            setTimeout(() => {
                claimModalBackdrop.style.opacity = "1";
                claimModalBackdrop.style.pointerEvents = "auto";
                const content = document.getElementById("claim-modal-content");
                if (content) content.classList.remove("scale-95", "opacity-0");
            }, 10);
        }
        return; // İşlemi Modal Submit yakalayacak
        
    } else if (listing.listing_type === "need") {
        if (!user || user.role !== "donor") {
            showToast("İhtiyaç ilanlarına destek olabilmek için bağışçı girişi yapmanız gerekmektedir.", "danger");
            return;
        }
        
        // Popup engelleyiciyi aşmak için kullanıcı tıkladığı an (senkron olarak) sekme açılır.
        let newTab = null;
        if (actionType === 'purchase') {
            newTab = window.open("about:blank", "_blank");
        }
        
        // Donor ihtiyaç eşleşmesi
        submitMatchRequest(listingId, {}, actionType === 'purchase', newTab);
    }
}

async function submitMatchRequest(listingId, payload, isNeedMatch = false, newTab = null) {
    const user = getLoggedInUser();
    payload.donor_id = user.id;

    try {
        const response = await fetch(`/api/listings/${listingId}/match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || "Eşleşme başarıyla tamamlandı.");
            loadListings();
            
            if (data.cargo_code) {
                alert(`EŞLEŞME BAŞARILI!\n\nLojistik Kargo Kodunuz: ${data.cargo_code}\nLütfen en yakın PTT şubesine bu kod ile eşyayı teslim ediniz.\nUmut Bağı'na desteğiniz için teşekkürler!`);
            }
            
            if (isNeedMatch && newTab) {
                newTab.location.href = "https://share.google/C4ums0PGjIeNKsIjL";
            } else if (!isNeedMatch && !data.cargo_code) {
                // Elindekini bağışla denildiyse belirgin bir uyarı ver.
                const listing = allListings.find(l => l.id === listingId);
                if (listing) {
                    alert(`BAĞIŞ BİLGİLERİ:\n\nAd Soyad: ${listing.creator_name}\nTelefon: ${listing.contact_phone || 'Belirtilmemiş'}\nAdres: ${listing.contact_address || 'Belirtilmemiş'}\n\nLütfen kargonuzu bu adrese yönlendiriniz.`);
                }
            }
        } else {
            if (newTab) newTab.close();
            showToast(data.error || "Eşleşme başarısız oldu.", "danger");
        }
    } catch (err) {
        if (newTab) newTab.close();
        showToast("Sunucu ile bağlantı hatası.", "danger");
    }
}

async function cancelMatch(listingId) {
    if (!confirm("Bu işlemi iptal etmek istediğinizden emin misiniz? İlan tekrar yayınlanacaktır.")) return;

    const user = getLoggedInUser();
    try {
        const response = await fetch(`/api/listings/${listingId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || "İptal işlemi başarıyla gerçekleştirildi.");
            loadListings();
        } else {
            showToast(data.error || "İşlem başarısız oldu.", "danger");
        }
    } catch (err) {
        showToast("Sunucu ile bağlantı hatası.", "danger");
    }
}

async function deleteListing(listingId) {
    if (!confirm('Bu ilanı tamamen kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    const user = getLoggedInUser();
    try {
        const response = await fetch(`/api/listings/${listingId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message || 'İlan başarıyla kaldırıldı.');
            loadListings();
        } else {
            showToast(data.error || 'İlan silinemedi.', 'danger');
        }
    } catch (err) {
        showToast('Sunucu ile bağlantı hatası.', 'danger');
    }
}

// Yeni İlan Oluşturma Formu Kontrolleri (Tailwind CSS Modal & Resim Yükleme Entegrasyonu)
function setupListingForm() {
    const openModalBtn = document.getElementById("btn-new-listing");
    const closeModalBtn = document.getElementById("btn-close-modal");
    const cancelModalBtn = document.getElementById("btn-cancel-modal");
    const modalBackdrop = document.getElementById("new-listing-modal");
    const form = document.getElementById("form-new-listing");
    
    // Resim Yükleme Elemanları
    const imageInput = document.getElementById("listing-image");
    const uploadBox = document.getElementById("image-upload-box");
    const previewBox = document.getElementById("image-preview-box");
    const previewImg = document.getElementById("image-preview-img");
    const removeImgBtn = document.getElementById("btn-remove-image");

    const user = getLoggedInUser();
    
    // SADECE DONÖRLER (Bağışçılar) "İlan Aç" Butonunu Görebilir
    if (openModalBtn) {
        if (user && user.role === "donor") {
            openModalBtn.style.display = "inline-flex";
        } else {
            openModalBtn.style.display = "none";
        }
    }

    // SADECE ONAYLI ENGELLİLER "İhtiyacım Var" Butonunu Görebilir
    const openNeedBtn = document.getElementById("btn-new-need");
    if (openNeedBtn) {
        if (user && user.role === "disabled" && user.is_verified) {
            openNeedBtn.style.display = "inline-flex";
        } else {
            openNeedBtn.style.display = "none";
        }
    }

    const openModal = () => {
        modalBackdrop.style.display = "flex";
        setTimeout(() => {
            modalBackdrop.style.opacity = "1";
            modalBackdrop.style.pointerEvents = "auto";
            const content = document.getElementById("new-listing-modal-content");
            if (content) content.classList.remove("scale-95", "opacity-0");
        }, 10);
    };

    const closeModal = () => {
        const content = document.getElementById("new-listing-modal-content");
        if (content) content.classList.add("scale-95", "opacity-0");
        modalBackdrop.style.opacity = "0";
        modalBackdrop.style.pointerEvents = "none";
        setTimeout(() => {
            modalBackdrop.style.display = "none";
            if (form) form.reset();
            if (removeImgBtn) removeImgBtn.click(); // Resmi sıfırla
        }, 300);
    };

    if (openModalBtn && modalBackdrop) openModalBtn.addEventListener("click", openModal);
    if (closeModalBtn && modalBackdrop) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn && modalBackdrop) cancelModalBtn.addEventListener("click", closeModal);

    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) closeModal();
        });
    }

    // Drag & Drop Image Logic
    if (imageInput && uploadBox && previewBox && previewImg && removeImgBtn) {
        imageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    uploadBox.classList.add("hidden");
                    previewBox.classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });

        uploadBox.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadBox.classList.add("border-blue-500", "bg-blue-50");
        });
        
        uploadBox.addEventListener("dragleave", () => {
            uploadBox.classList.remove("border-blue-500", "bg-blue-50");
        });

        uploadBox.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadBox.classList.remove("border-blue-500", "bg-blue-50");
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                imageInput.files = e.dataTransfer.files; // FileList aktarımı
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    uploadBox.classList.add("hidden");
                    previewBox.classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });

        removeImgBtn.addEventListener("click", () => {
            imageInput.value = "";
            previewImg.src = "";
            previewBox.classList.add("hidden");
            uploadBox.classList.remove("hidden");
        });
    }

    // Form Submit (Artık JSON değil, FormData olarak gidiyor çünkü dosya var)
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user || user.role !== "donor") {
                showToast("Sadece bağışçı (donör) rolüne sahip kullanıcılar bağış ilanı açabilir.", "danger");
                return;
            }

            const title = document.getElementById("listing-title").value;
            const category = document.getElementById("listing-category").value;
            const description = document.getElementById("listing-description").value;
            
            const formData = new FormData();
            formData.append("title", title);
            formData.append("category", category);
            formData.append("description", description);
            formData.append("listing_type", "donation");
            formData.append("created_by", user.id);
            
            if (imageInput && imageInput.files.length > 0) {
                formData.append("image", imageInput.files[0]);
            }

            showToast("İlan oluşturuluyor ve resim yükleniyor, lütfen bekleyin...", "warning");

            try {
                const response = await fetch("/api/listings", {
                    method: "POST",
                    body: formData // Content-Type belirtilmez, browser boundary ekler
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast("İhtiyaç ilanınız başarıyla oluşturuldu.");
                    closeModal();
                    loadListings();
                } else {
                    showToast(data.error || "İlan oluşturulamadı.", "danger");
                }
            } catch (err) {
                showToast("Sunucu ile bağlantı hatası.", "danger");
            }
        });
    }
    // İhtiyaç Modalı Kontrolleri
    const needModalBackdrop = document.getElementById("new-need-modal");
    const closeNeedBtn = document.getElementById("btn-close-need-modal");
    const cancelNeedBtn = document.getElementById("btn-cancel-need-modal");
    const needForm = document.getElementById("form-new-need");

    const openNeedModal = () => {
        needModalBackdrop.style.display = "flex";
        setTimeout(() => {
            needModalBackdrop.style.opacity = "1";
            needModalBackdrop.style.pointerEvents = "auto";
            const content = document.getElementById("new-need-modal-content");
            if (content) content.classList.remove("scale-95", "opacity-0");
        }, 10);
    };

    const closeNeedModalFunc = () => {
        const content = document.getElementById("new-need-modal-content");
        if (content) content.classList.add("scale-95", "opacity-0");
        needModalBackdrop.style.opacity = "0";
        needModalBackdrop.style.pointerEvents = "none";
        setTimeout(() => {
            needModalBackdrop.style.display = "none";
            if (needForm) needForm.reset();
        }, 300);
    };

    if (openNeedBtn && needModalBackdrop) openNeedBtn.addEventListener("click", openNeedModal);
    if (closeNeedBtn && needModalBackdrop) closeNeedBtn.addEventListener("click", closeNeedModalFunc);
    if (cancelNeedBtn && needModalBackdrop) cancelNeedBtn.addEventListener("click", closeNeedModalFunc);

    if (needModalBackdrop) {
        needModalBackdrop.addEventListener("click", (e) => {
            if (e.target === needModalBackdrop) closeNeedModalFunc();
        });
    }

    // İhtiyaç Formu Submit
    if (needForm) {
        needForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user || user.role !== "disabled" || !user.is_verified) {
                showToast("Bu işlem için yetkiniz yok.", "danger");
                return;
            }

            const city = document.getElementById("need-city").value;
            const district = document.getElementById("need-district").value;
            const phone = document.getElementById("need-phone").value;
            const address = document.getElementById("need-address").value;
            const category = "Genel İhtiyaç";
            const description = document.getElementById("need-description").value;
            
            // İhtiyaç için otomatik title oluştur
            const title = `${user.name} kullanıcısının İhtiyacı`;
            
            const formData = new FormData();
            formData.append("title", title);
            formData.append("category", category);
            formData.append("description", description);
            formData.append("listing_type", "need");
            formData.append("city", city);
            formData.append("district", district);
            formData.append("contact_phone", phone);
            formData.append("contact_address", address);
            formData.append("created_by", user.id);

            showToast("İhtiyaç talebiniz yayınlanıyor...", "warning");

            try {
                const response = await fetch("/api/listings", {
                    method: "POST",
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast("İhtiyaç talebiniz başarıyla yayınlandı.");
                    closeNeedModalFunc();
                    loadListings();
                } else {
                    showToast(data.error || "İlan oluşturulamadı.", "danger");
                }
            } catch (err) {
                showToast("Sunucu ile bağlantı hatası.", "danger");
            }
        });
    }

    // --- TALEP ETME (EŞLEŞME) MODALI KONTROLLERİ ---
    const claimModalBackdrop = document.getElementById("claim-modal");
    const closeClaimBtn = document.getElementById("btn-close-claim-modal");
    const cancelClaimBtn = document.getElementById("btn-cancel-claim-modal");
    const claimForm = document.getElementById("form-claim-listing");

    const closeClaimModalFunc = () => {
        const content = document.getElementById("claim-modal-content");
        if (content) content.classList.add("scale-95", "opacity-0");
        if (claimModalBackdrop) {
            claimModalBackdrop.style.opacity = "0";
            claimModalBackdrop.style.pointerEvents = "none";
            setTimeout(() => {
                claimModalBackdrop.style.display = "none";
                if (claimForm) claimForm.reset();
            }, 300);
        }
    };

    if (closeClaimBtn && claimModalBackdrop) closeClaimBtn.addEventListener("click", closeClaimModalFunc);
    if (cancelClaimBtn && claimModalBackdrop) cancelClaimBtn.addEventListener("click", closeClaimModalFunc);

    if (claimModalBackdrop) {
        claimModalBackdrop.addEventListener("click", (e) => {
            if (e.target === claimModalBackdrop) closeClaimModalFunc();
        });
    }

    if (claimForm) {
        claimForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const listingId = document.getElementById("claim-listing-id").value;
            const claimerName = document.getElementById("claim-name").value;
            const claimerPhone = document.getElementById("claim-phone").value;
            const claimerAddress = document.getElementById("claim-address").value;

            closeClaimModalFunc();
            submitMatchRequest(listingId, {
                claimer_name: claimerName,
                claimer_phone: claimerPhone,
                claimer_address: claimerAddress
            });
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
                const response = await fetch("/api/auth/verify-report", {
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

// Canlı Veri Takibi (Polling) - Her 5 saniyede bir ilanları kontrol et
document.addEventListener("DOMContentLoaded", () => {
    setInterval(() => {
        // Sadece sayfa açık ve görünürse (farklı sekmede değilse) çalışsın
        if (document.visibilityState !== "visible") return;
        
        // Kullanıcının açık bir formu (modal) varsa yenilemeyi durdur ki yazdıkları silinmesin/dikkati dağılmasın
        const claimModal = document.getElementById("claim-modal");
        const newNeedModal = document.getElementById("new-need-modal");
        const newDonationModal = document.getElementById("new-listing-modal");
        
        const isAnyModalOpen = 
            (claimModal && claimModal.style.display !== "none") ||
            (newNeedModal && newNeedModal.style.display !== "none") ||
            (newDonationModal && newDonationModal.style.display !== "none");
            
        if (!isAnyModalOpen) {
            // true (silent mode) olarak yükle ki Loading ekranı çıkmasın
            loadListings(true);
        }
    }, 5000);
});

// =========================================
// ERİŞİLEBİLİRLİK (A11Y) MODÜLÜ MANTIĞI
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const a11yToggle = document.getElementById("a11y-toggle");
    const a11yMenu = document.getElementById("a11y-menu");
    const a11yClose = document.getElementById("a11y-close");
    
    const btnIncrease = document.getElementById("a11y-text-increase");
    const btnDecrease = document.getElementById("a11y-text-decrease");
    const btnContrast = document.getElementById("a11y-contrast");
    const btnTts = document.getElementById("a11y-tts");
    
    let currentFontSize = 100;
    let isTtsActive = false;
    let ttsHandler = null;

    if (!a11yToggle) return;

    // Menü Aç/Kapat
    a11yToggle.addEventListener("click", () => {
        a11yMenu.classList.toggle("active");
    });
    
    a11yClose.addEventListener("click", () => {
        a11yMenu.classList.remove("active");
    });

    // 1. Metin Boyutu Değiştirme
    btnIncrease.addEventListener("click", () => {
        if (currentFontSize < 150) {
            currentFontSize += 10;
            document.documentElement.style.fontSize = currentFontSize + "%";
        }
    });

    btnDecrease.addEventListener("click", () => {
        if (currentFontSize > 80) {
            currentFontSize -= 10;
            document.documentElement.style.fontSize = currentFontSize + "%";
        }
    });

    // 2. Yüksek Kontrast (Dark Mode / High Contrast)
    btnContrast.addEventListener("click", () => {
        document.body.classList.toggle("high-contrast");
        const isActive = document.body.classList.contains("high-contrast");
        localStorage.setItem("highContrast", isActive);
    });
    
    // Sayfa yüklendiğinde eski kontrast tercihini hatırla
    if (localStorage.getItem("highContrast") === "true") {
        document.body.classList.add("high-contrast");
    }

    // 3. Sesli Okuma (Text-to-Speech)
    btnTts.addEventListener("click", () => {
        isTtsActive = !isTtsActive;
        btnTts.innerHTML = isTtsActive ? 
            '<i class="fa-solid fa-volume-high"></i> Sesli Okuma (Açık)' : 
            '<i class="fa-solid fa-volume-xmark"></i> Sesli Okuma (Kapalı)';
            
        if (isTtsActive) {
            btnTts.style.backgroundColor = "var(--primary)";
            btnTts.style.color = "white";
            showToast("Sesli asistan aktif. Okunmasını istediğiniz metnin üzerine fare ile gelin.", "success");
            
            // Hover olayını başlat
            ttsHandler = (e) => {
                // Sadece metin içeren ana elementleri oku (P, H1-H6, SPAN, A, BUTTON, vb)
                const tagsToRead = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LI', 'TD'];
                if (tagsToRead.includes(e.target.tagName)) {
                    const textToRead = e.target.innerText || e.target.textContent;
                    if (textToRead && textToRead.trim().length > 0) {
                        window.speechSynthesis.cancel(); // Önceki okumayı durdur
                        const utterance = new SpeechSynthesisUtterance(textToRead.trim());
                        utterance.lang = 'tr-TR';
                        utterance.rate = 1.0;
                        window.speechSynthesis.speak(utterance);
                    }
                }
            };
            document.addEventListener('mouseover', ttsHandler);
            
        } else {
            btnTts.style.backgroundColor = "";
            btnTts.style.color = "";
            window.speechSynthesis.cancel();
            if (ttsHandler) {
                document.removeEventListener('mouseover', ttsHandler);
            }
            showToast("Sesli asistan kapatıldı.");
        }
    });
});

// ==========================================
// CİMER/JÜRİ TEK TIKLA DEMO GİRİŞİ (QUICK LOGIN)
// ==========================================
async function demoLogin(role) {
    try {
        const response = await fetch('/api/auth/demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem("user", JSON.stringify(data.user));
            alert(`✅ ${data.user.name} olarak sisteme başarılı bir şekilde giriş yapıldı!`);
            
            // Yönlendirme
            if (role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
        } else {
            alert(`Hata: ${data.error}`);
        }
    } catch (err) {
        console.error("Demo giriş hatası:", err);
        alert("Bağlantı hatası oluştu, sunucu çalışıyor mu?");
    }
}
