import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Çevre değişkenlerini yükle
load_dotenv()

# Küresel SQLAlchemy nesnesini tanımla
db = SQLAlchemy()

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
    
    # SQLAlchemy nesnesini uygulamaya bağla
    db.init_app(app)
    
    # Dairesel bağımlılıkları önlemek için blueprint'leri fonksiyon içinde içe aktar
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    
    # Blueprint'leri uygulamaya kaydet
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    
    return app
