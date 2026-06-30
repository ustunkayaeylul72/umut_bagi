import os
from app import create_app, db
from app.models.user import User
from app.models.listing import Listing

app = create_app()

with app.app_context():
    db.create_all()

    # Yöneticiler
    u_admin = User.query.filter_by(role='admin').first()
    if not u_admin:
        u_admin = User(name='Sistem Yöneticisi', email='admin@umutbagi.com', role='admin', is_verified=True)
        db.session.add(u_admin)

    # Bağışçılar
    u_donor1 = User.query.filter_by(email='ahmet@test.com').first()
    if not u_donor1:
        u_donor1 = User(name='Ahmet Yılmaz', email='ahmet@test.com', role='donor', is_verified=False)
        db.session.add(u_donor1)
        
    u_donor2 = User.query.filter_by(email='zeynep@test.com').first()
    if not u_donor2:
        u_donor2 = User(name='Zeynep Çelik', email='zeynep@test.com', role='donor', is_verified=False)
        db.session.add(u_donor2)

    # İhtiyaç Sahipleri
    u_disabled1 = User.query.filter_by(email='ayse@test.com').first()
    if not u_disabled1:
        u_disabled1 = User(name='Ayşe Demir', email='ayse@test.com', role='disabled', is_verified=True, 
                         disability_summary='Görme engelli raporu', disability_percentage=80, disability_group='Görme')
        db.session.add(u_disabled1)

    u_disabled2 = User.query.filter_by(email='mehmet@test.com').first()
    if not u_disabled2:
        u_disabled2 = User(name='Mehmet Kaya', email='mehmet@test.com', role='disabled', is_verified=False, 
                         disability_summary='Ortopedik engelli raporu (Onay Bekliyor)', disability_percentage=60, disability_group='Ortopedik')
        db.session.add(u_disabled2)

    db.session.commit()

    # İlanları Güncelle veya Ekle
    images_map = {
        'Akülü Tekerlekli Sandalye': 'uploads/tekerlekli_sandalye.jpg',
        'Braille Alfabesi Kitap Seti': 'uploads/braille.png',
        'İşitme Cihazı Pili': 'uploads/battery.png',
        'Konuşan Saat': 'uploads/clock.png'
    }

    if Listing.query.count() < 3:
        l1 = Listing(title='Akülü Tekerlekli Sandalye', description='İhtiyaç fazlası, temiz kullanılmış akülü tekerlekli sandalye.', category='Medikal', status='open', listing_type='donation', created_by=u_donor1.id)
        l2 = Listing(title='Braille Alfabesi Kitap Seti', description='Eğitimime devam edebilmek için Braille kitap setine ihtiyacım var.', category='Eğitim', status='open', listing_type='need', created_by=u_disabled1.id)
        l3 = Listing(title='İşitme Cihazı Pili', description='Kullanmadığım işitme cihazı pillerini bağışlamak istiyorum.', category='Medikal', status='open', listing_type='donation', created_by=u_donor2.id)
        l4 = Listing(title='Konuşan Saat', description='Görme engelliler için konuşan saat bağışı.', category='Teknoloji', status='matched', listing_type='donation', created_by=u_donor1.id, matched_donor_id=u_disabled1.id)
        db.session.add_all([l1, l2, l3, l4])
        db.session.commit()

    # Mevcut tüm ilanların fotoğraflarını zorla (force) güncelle
    for l in Listing.query.all():
        if l.title in images_map:
            l.image_url = images_map[l.title]
    
    db.session.commit()

    print('>>> Örnek veriler (Kullanıcılar ve İlanlar) başarıyla veritabanına eklendi!')
