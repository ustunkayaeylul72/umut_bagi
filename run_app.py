import os
from app import create_app, db
from app.models.user import User
from app.models.listing import Listing

app = create_app()

# Veritabanını ilklendir ve tabloları oluştur
with app.app_context():
    db.create_all()
    print(">>> Veritabanı tabloları kontrol edildi/oluşturuldu.")
    
if __name__ == '__main__':
    print(">>> Flask sunucusu başlatılıyor...")
    app.run(debug=True, port=5000)
