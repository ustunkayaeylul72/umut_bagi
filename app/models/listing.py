from app import db

class Listing(db.Model):
    """
    Umut Bağı platformundaki ilanları/ihtiyaçları temsil eden model.
    Durumlar: 'open' (Açık), 'matched' (Eşleşti/Üstlenildi), 'closed' (Kapatıldı).
    """
    __tablename__ = 'listings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='open', nullable=False)
    listing_type = db.Column(db.String(50), default='donation', nullable=False) # 'donation' veya 'need'
    city = db.Column(db.String(100), nullable=True)
    district = db.Column(db.String(100), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    # İlanı Talep Eden (Eşleşen) Kullanıcının Girdiği İletişim Bilgileri
    claimer_name = db.Column(db.String(150), nullable=True)
    claimer_phone = db.Column(db.String(20), nullable=True)
    claimer_address = db.Column(db.Text, nullable=True)
    
    # İhtiyaç İlanını Açan Kişinin İletişim Bilgileri
    contact_phone = db.Column(db.String(20), nullable=True)
    contact_address = db.Column(db.Text, nullable=True)
    
    # Yabancı Anahtarlar (Foreign Keys)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    matched_donor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # İlan durumunun doğruluğunu veri tabanı düzeyinde denetlemek için Check Constraint
    __table_args__ = (
        db.CheckConstraint("status IN ('open', 'matched', 'closed')", name="check_listing_status"),
    )

    # İlişkiler:
    # İlanı oluşturan kullanıcı ile ilişki
    creator = db.relationship(
        'User',
        foreign_keys=[created_by],
        back_populates='created_listings'
    )

    # İlanı üstlenen donör ile ilişki
    matched_donor = db.relationship(
        'User',
        foreign_keys=[matched_donor_id],
        back_populates='matched_listings'
    )

    def to_dict(self):
        """Model verilerini sözlük biçimine dönüştürür."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "status": self.status,
            "listing_type": self.listing_type,
            "city": self.city,
            "district": self.district,
            "image_url": self.image_url,
            "created_by": self.created_by,
            "matched_donor_id": self.matched_donor_id,
            "claimer_name": self.claimer_name,
            "claimer_phone": self.claimer_phone,
            "claimer_address": self.claimer_address,
            "contact_phone": self.contact_phone,
            "contact_address": self.contact_address
        }

    def __repr__(self):
        return f"<Listing {self.title} ({self.status})>"
