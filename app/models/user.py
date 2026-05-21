from app import db

class User(db.Model):
    """
    Umut Bağı platformundaki kullanıcıları temsil eden model.
    Roller: 'disabled' (Engelli birey) veya 'donor' (Destekçi/Bağışçı).
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    disability_summary = db.Column(db.Text, nullable=True)
    disability_percentage = db.Column(db.Integer, nullable=True)
    disability_group = db.Column(db.String(100), nullable=True)
    tc_hash = db.Column(db.String(64), unique=True, nullable=True)
    report_expiry_date = db.Column(db.Date, nullable=True)

    # Rollerin geçerliliğini veri tabanı düzeyinde denetlemek için Check Constraint ekliyoruz
    __table_args__ = (
        db.CheckConstraint("role IN ('disabled', 'donor')", name="check_user_role"),
    )

    # İlişkiler:
    # 1. Kullanıcının oluşturduğu ilanlar (Örn: Engelli bireyin açtığı ihtiyaç ilanları)
    created_listings = db.relationship(
        'Listing',
        foreign_keys='Listing.created_by',
        back_populates='creator',
        cascade='all, delete-orphan',
        lazy=True
    )

    # 2. Donörün eşleştiği/üstlendiği ilanlar (Örn: Donörün yardım etmek için üstlendiği ilanlar)
    matched_listings = db.relationship(
        'Listing',
        foreign_keys='Listing.matched_donor_id',
        back_populates='matched_donor',
        lazy=True
    )

    def to_dict(self):
        """Model verilerini sözlük biçimine dönüştürür."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_verified": self.is_verified,
            "disability_summary": self.disability_summary,
            "disability_percentage": self.disability_percentage,
            "disability_group": self.disability_group,
            "report_expiry_date": self.report_expiry_date.isoformat() if self.report_expiry_date else None
        }

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
