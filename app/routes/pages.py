from flask import Blueprint, render_template

pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/')
def index():
    """Ana sayfa / Dashboard arayüzünü döndürür."""
    return render_template('index.html')

@pages_bp.route('/listings-view')
def listings_view():
    """İlan listeleme ve ilan açma arayüzünü döndürür."""
    return render_template('listings.html')

@pages_bp.route('/auth/view')
def auth_view():
    """Giriş Yap / Kayıt Ol arayüzünü (auth.html) döndürür."""
    return render_template('auth.html')

@pages_bp.route('/admin')
def admin_view():
    """Vakıf Yönetim Paneli (admin.html) arayüzünü döndürür."""
    return render_template('admin.html')
