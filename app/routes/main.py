from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
import os
import uuid
from app.models.user import User
from app.models.listing import Listing
from app import db

listings_bp = Blueprint('listings', __name__, url_prefix='/listings')

# --- API (JSON) UÇ NOKTALARI ---

@listings_bp.route('', methods=['GET'])
def get_listings():
    """Tüm ilanları JSON formatında listeler (Oluşturan kullanıcının onay bilgilerini içerir)."""
    listings = Listing.query.all()
    result = []
    for l in listings:
        ldict = l.to_dict()
        ldict['creator_name'] = l.creator.name if l.creator else "Bilinmeyen Kullanıcı"
        ldict['creator_is_verified'] = l.creator.is_verified if l.creator else False
        ldict['creator_percentage'] = l.creator.disability_percentage if l.creator else None
        ldict['creator_group'] = l.creator.disability_group if l.creator else None
        ldict['matched_donor_name'] = l.matched_donor.name if l.matched_donor else None
        result.append(ldict)
    return jsonify(result), 200

@listings_bp.route('', methods=['POST'])
def create_listing():
    """Yeni bir ilan oluşturur (Yalnızca 'disabled' rolündeki doğrulanmış kullanıcılar). Resim desteği eklendi."""
    # JSON mu yoksa FormData mı kontrolü
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    created_by = data.get('created_by')
    listing_type = data.get('listing_type', 'donation')
    city = data.get('city')
    district = data.get('district')
    
    if not title or not description or not category or not created_by:
        return jsonify({"error": "Eksik parametre. 'title', 'description', 'category' ve 'created_by' zorunludur."}), 400
        
    user = User.query.get(created_by)
    if not user:
        return jsonify({"error": "İlanı oluşturan kullanıcı bulunamadı."}), 404
        
    # Yetki Kontrolü
    if listing_type == 'donation':
        if user.role != 'donor':
            return jsonify({"error": "Sadece bağışçılar 'Bağış' ilanı oluşturabilir."}), 403
    elif listing_type == 'need':
        if user.role != 'disabled':
            return jsonify({"error": "Sadece engelli bireyler 'İhtiyaç' ilanı oluşturabilir."}), 403
        if not user.is_verified:
            return jsonify({"error": "İhtiyaç ilanı açabilmek için öncelikle e-Devlet üzerinden raporunuzu doğrulatmalısınız."}), 403
    else:
        return jsonify({"error": "Geçersiz ilan türü."}), 400

    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'listings')
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, unique_filename)
            file.save(file_path)
            image_url = f"uploads/listings/{unique_filename}"
        
    try:
        new_listing = Listing(
            title=title,
            description=description,
            category=category,
            status='open',
            listing_type=listing_type,
            city=city,
            district=district,
            contact_phone=request.form.get('contact_phone'),
            contact_address=request.form.get('contact_address'),
            created_by=created_by,
            image_url=image_url
        )
        db.session.add(new_listing)
        db.session.commit()
        
        return jsonify({
            "message": "İlan başarıyla oluşturuldu.",
            "listing": new_listing.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/admin/data', methods=['GET'])
def get_admin_data():
    """Admin dashboard için tüm kullanıcıları, ilanları ve istatistikleri döndürür."""
    users = User.query.all()
    listings = Listing.query.all()
    
    users_data = [u.to_dict() for u in users]
    
    listings_data = []
    for l in listings:
        ldict = l.to_dict()
        ldict['creator_name'] = l.creator.name if l.creator else "Bilinmeyen Kullanıcı"
        ldict['matched_donor_name'] = l.matched_donor.name if l.matched_donor else None
        listings_data.append(ldict)
        
    stats = {
        "total_users": len(users),
        "total_disabled": sum(1 for u in users if u.role == 'disabled'),
        "total_donors": sum(1 for u in users if u.role == 'donor'),
        "total_listings": len(listings),
        "matched_listings": sum(1 for l in listings if l.status == 'matched'),
        "open_listings": sum(1 for l in listings if l.status == 'open')
    }
        
    return jsonify({
        "stats": stats,
        "users": users_data,
        "listings": listings_data
    }), 200

@listings_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    """Admin yetkisiyle bir kullanıcıyı kalıcı olarak siler."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404
        
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Kullanıcı başarıyla silindi."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/admin/users/<int:user_id>/verify', methods=['POST'])
def admin_verify_user(user_id):
    """Admin yetkisiyle bir kullanıcının raporunu manuel olarak onaylar."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404
        
    try:
        user.is_verified = True
        db.session.commit()
        return jsonify({"message": "Kullanıcı başarıyla onaylandı."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/admin/listings/<int:listing_id>/reset', methods=['POST'])
def admin_reset_listing(listing_id):
    """Admin yetkisiyle bir ilanın eşleşmesini bozar ve tekrar 'open' (Açık) hale getirir."""
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    try:
        listing.status = 'open'
        listing.matched_donor_id = None
        
        # Eğer bağış ilanıysa ve bir engelli talep ettiyse iletişim bilgilerini temizle
        if listing.listing_type == 'donation':
            listing.claimer_name = None
            listing.claimer_phone = None
            listing.claimer_address = None
            
        db.session.commit()
        return jsonify({"message": "Eşleşme başarıyla bozuldu ve ilan tekrar açıldı."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/admin/listings/<int:listing_id>', methods=['DELETE'])
def admin_delete_listing(listing_id):
    """Admin yetkisiyle sistemdeki herhangi bir ilanı kalıcı olarak siler."""
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    try:
        db.session.delete(listing)
        db.session.commit()
        return jsonify({"message": "İlan sistemden tamamen kaldırıldı."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/<int:listing_id>/match', methods=['POST'])
def match_listing(listing_id):
    """Bir ilanı bir donör ile eşleştirir (Yalnızca 'donor' rolündeki kullanıcılar)."""
    data = request.get_json() or {}
    donor_id = data.get('donor_id')
    claimer_name = data.get('claimer_name')
    claimer_phone = data.get('claimer_phone')
    claimer_address = data.get('claimer_address')
    
    if not donor_id:
        return jsonify({"error": "Kullanıcı ID'si ('donor_id') zorunludur."}), 400
        
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    if listing.status != 'open':
        return jsonify({"error": "Bu ilan zaten üstlenilmiş veya kapatılmış."}), 400
        
    donor = User.query.get(donor_id)
    if not donor:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404
        
    if listing.listing_type == 'donation':
        if donor.role != 'disabled':
            return jsonify({"error": "Bu bağış ilanını sadece engelli bireyler talep edebilir."}), 403
        if not donor.is_verified:
            return jsonify({"error": "Bağış ilanlarını talep edebilmek için öncelikle e-Devlet üzerinden sağlık raporunuzu doğrulatmalısınız."}), 403
    elif listing.listing_type == 'need':
        if donor.role != 'donor':
            return jsonify({"error": "Bu ihtiyaç ilanını sadece bağışçılar (donörler) üstlenebilir."}), 403
            
    try:
        listing.matched_donor_id = donor_id
        listing.status = 'matched'
        
        # Eğer bir bağış ilanına talep geliyorsa iletişim bilgilerini kaydet
        if listing.listing_type == 'donation':
            listing.claimer_name = claimer_name
            listing.claimer_phone = claimer_phone
            listing.claimer_address = claimer_address
            
        db.session.commit()
        
        msg = "İlan başarıyla adınıza rezerve edildi." if listing.listing_type == 'donation' else "İhtiyaç ilanını başarıyla üstlendiniz, dayanışmanız için teşekkür ederiz."
        import random
        return jsonify({
            "message": msg,
            "cargo_code": f"PTT-UMT-{random.randint(1000, 9999)}",
            "listing": listing.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/<int:listing_id>/cancel', methods=['POST'])
def cancel_match(listing_id):
    """Bir ilandaki eşleşmeyi (talebi/üstlenmeyi) iptal eder."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Kullanıcı ID'si ('user_id') zorunludur."}), 400
        
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    if listing.status != 'matched':
        return jsonify({"error": "İptal edilebilecek bir eşleşme bulunmuyor."}), 400
        
    if str(listing.matched_donor_id) != str(user_id):
        return jsonify({"error": "Sadece eşleşen kişi iptal edebilir."}), 403
        
    try:
        listing.matched_donor_id = None
        listing.status = 'open'
        
        if listing.listing_type == 'donation':
            listing.claimer_name = None
            listing.claimer_phone = None
            listing.claimer_address = None
            
        db.session.commit()
        return jsonify({"message": "İptal işlemi başarıyla gerçekleştirildi, ilan tekrar açıldı."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@listings_bp.route('/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id):
    """Kullanıcının kendi oluşturduğu ilanı silmesini sağlar."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Kullanıcı ID'si ('user_id') zorunludur."}), 400
        
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    if str(listing.created_by) != str(user_id):
        return jsonify({"error": "Sadece ilanı oluşturan kişi silebilir."}), 403
        
    try:
        db.session.delete(listing)
        db.session.commit()
        return jsonify({"message": "İlan başarıyla kaldırıldı."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500
