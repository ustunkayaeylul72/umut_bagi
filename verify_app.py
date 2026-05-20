import os
import sys

# Proje dizinini python yoluna ekle
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.listing import Listing

def test_workflow():
    # Geçici test veritabanı ile uygulamayı oluştur
    test_db_path = "sqlite:///test_umut_bagi.db"
    
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': test_db_path,
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret'
    })
    
    with app.app_context():
        print("1. Veritabanı tabloları oluşturuluyor...")
        db.create_all()
        
        print("2. Test kullanıcıları oluşturuluyor...")
        # Engelli Kullanıcı
        disabled_user = User(
            name="Ahmet Yılmaz",
            email="ahmet@example.com",
            role="disabled",
            disability_summary="Görme engelli, ekran okuyucu uyumlu materyal ihtiyacı var.",
            is_verified=True
        )
        
        # Donör Kullanıcı
        donor_user = User(
            name="Zeynep Kaya",
            email="zeynep@example.com",
            role="donor",
            is_verified=True
        )
        
        db.session.add(disabled_user)
        db.session.add(donor_user)
        db.session.commit()
        
        print(f"   Kullanıcı 1 eklendi: {disabled_user}")
        print(f"   Kullanıcı 2 eklendi: {donor_user}")
        
        print("3. İhtiyaç ilanı oluşturuluyor...")
        new_listing = Listing(
            title="Ekran Okuyucu Desteği",
            description="Ders kitaplarımı seslendirebilecek gönüllü bir donör arıyorum.",
            category="Eğitim",
            status="open",
            created_by=disabled_user.id
        )
        db.session.add(new_listing)
        db.session.commit()
        
        print(f"   İlan eklendi: {new_listing}")
        
        # İlişki kontrolü
        print("   Kullanıcının oluşturduğu ilanlar:")
        for lst in disabled_user.created_listings:
            print(f"     - {lst.title}")
            assert lst.created_by == disabled_user.id
            
        print("4. İlan donör ile eşleştiriliyor...")
        new_listing.matched_donor_id = donor_user.id
        new_listing.status = "matched"
        db.session.commit()
        
        print(f"   İlan eşleştirildi. Güncel İlan Durumu: {new_listing.status}")
        
        # Eşleşme ilişkileri kontrolü
        print("   Donörün üstlendiği ilanlar:")
        for lst in donor_user.matched_listings:
            print(f"     - {lst.title} (Oluşturan: {lst.creator.name})")
            assert lst.matched_donor_id == donor_user.id
            
        # Temizlik ve Kapatma
        print("5. Testler başarıyla tamamlandı. Veritabanı temizleniyor...")
        db.drop_all()
        
    # Test veritabanı dosyasını sil
    if os.path.exists("test_umut_bagi.db"):
        os.remove("test_umut_bagi.db")
    print("   Test veritabanı silindi.")
    print("\n>>> HER ŞEY BAŞARIYLA DOĞRULANDI! YAPILANDIRMA VE VERİ TABANI ALTYAPISI DÜZGÜN ÇALIŞIYOR. <<<")

if __name__ == "__main__":
    test_workflow()
