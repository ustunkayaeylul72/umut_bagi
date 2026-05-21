import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from flask_apscheduler import APScheduler

# Çevre değişkenlerini yükle
load_dotenv()

# Küresel SQLAlchemy nesnesini tanımla
db = SQLAlchemy()

# Küresel Scheduler nesnesi
scheduler = APScheduler()

def check_expired_reports():
    """Arka planda çalışarak süresi dolan raporların onayını kaldırır."""
    from app.models.user import User
    from datetime import date
    from app import db
    
    # APScheduler görevleri kendi thread'inde çalıştığı için Flask app_context gerektirir
    with scheduler.app.app_context():
        expired_users = User.query.filter(
            User.is_verified == True, 
            User.report_expiry_date != None, 
            User.report_expiry_date < date.today()
        ).all()
        
        for u in expired_users:
            u.is_verified = False
            
        if expired_users:
            db.session.commit()
            print(f">>> [Arka Plan] {len(expired_users)} kullanıcının rapor süresi dolduğu için onayları kaldırıldı.")

def create_app(test_config=None):
    """
    Application Factory Pattern kullanarak Flask uygulamasını oluşturur ve yapılandırır.
    """
    app = Flask(__name__)
    
    # Varsayılan yapılandırma ayarları
    if test_config is None:
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')
        
        # PostgreSQL'in postgres:// URI biçimini SQLAlchemy ile uyumlu hale getirmek için postgresql:// ile değiştiriyoruz.
        db_url = os.environ.get('DATABASE_URL', 'sqlite:///umut_bagi.db')
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
            
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        app.config.update(test_config)
        
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Güvenlik Protokolü: CORS Yapılandırması (Kılavuz Bölüm 4.1)
    CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*")}})
    
    # SQLAlchemy nesnesini uygulamaya bağla
    db.init_app(app)
    
    # Dairesel bağımlılıkları önlemek için blueprint'leri fonksiyon içinde içe aktar
    from app.routes import api_bp
    from app.routes.pages import pages_bp
    
    # Blueprint'leri uygulamaya kaydet
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(pages_bp)
    
    # Scheduler Yapılandırması ve Başlatılması
    app.config['SCHEDULER_API_ENABLED'] = True
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.add_job(id='check_expired_reports_job', func=check_expired_reports, trigger='interval', minutes=1)
        scheduler.start()
    
    return app
