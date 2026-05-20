import os
from app import create_app, db
from app.models.user import User
from app.models.listing import Listing

app = create_app()

# Veritabanını ilklendir ve tabloları oluştur
with app.app_context():
    db.create_all()
    print(">>> Veritabanı tabloları kontrol edildi/oluşturuldu.")
    
    # Başlangıçta örnek test verileri yoksa ekle (opsiyonel)
    if not User.query.filter_by(email="ahmet@example.com").first():
        print(">>> Örnek veriler ekleniyor...")
        u1 = User(
            name="Ahmet Yılmaz",
            email="ahmet@example.com",
            role="disabled",
            disability_summary="Görme engelli, ekran okuyucu ses desteği arıyor.",
            is_verified=True
        )
        u2 = User(
            name="Zeynep Kaya",
            email="zeynep@example.com",
            role="donor",
            is_verified=True
        )
        db.session.add_all([u1, u2])
        db.session.commit()
        
        l1 = Listing(
            title="Ders Kitabı Seslendirme Desteği",
            description="Üniversite sınavına hazırlanıyorum. Fizik kitabımın sesli okunmasında destek olabilecek donör arıyorum.",
            category="Eğitim",
            status="open",
            created_by=u1.id
        )
        db.session.add(l1)
        db.session.commit()
        print(">>> Örnek kullanıcılar ve ilan başarıyla eklendi.")

if __name__ == '__main__':
    print(">>> Flask sunucusu başlatılıyor...")
    app.run(debug=True, port=5000)
