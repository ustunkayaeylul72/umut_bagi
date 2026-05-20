from flask import Blueprint, jsonify, request, render_template
from app.models.user import User
from app.models.listing import Listing
from app import db

main_bp = Blueprint('main', __name__)

# --- WEB ARAYÜZÜ (HTML) ROTALARI ---

@main_bp.route('/')
def index():
    """Ana sayfa / Dashboard arayüzünü döndürür."""
    return render_template('index.html')

@main_bp.route('/listings-view')
def listings_view():
    """İlan listeleme ve ilan açma arayüzünü döndürür."""
    return render_template('listings.html')

# --- API (JSON) UÇ NOKTALARI ---

@main_bp.route('/api/health')
def health():
    """Uygulama sağlık kontrolü API'si."""
    return jsonify({"status": "healthy"}), 200

@main_bp.route('/api/listings', methods=['GET'])
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

@main_bp.route('/api/listings', methods=['POST'])
def create_listing():
    """Yeni bir ilan oluşturur (Yalnızca 'disabled' rolündeki kullanıcılar)."""
    data = request.get_json() or {}
    
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    created_by = data.get('created_by')
    
    if not title or not description or not category or not created_by:
        return jsonify({"error": "Eksik parametre. 'title', 'description', 'category' ve 'created_by' zorunludur."}), 400
        
    user = User.query.get(created_by)
    if not user:
        return jsonify({"error": "İlanı oluşturan kullanıcı bulunamadı."}), 404
        
    if user.role != 'disabled':
        return jsonify({"error": "Sadece engelli rolüne sahip kullanıcılar ilan oluşturabilir."}), 403
        
    try:
        new_listing = Listing(
            title=title,
            description=description,
            category=category,
            status='open',
            created_by=created_by
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

@main_bp.route('/api/listings/<int:listing_id>/match', methods=['POST'])
def match_listing(listing_id):
    """Bir ilanı bir donör ile eşleştirir (Yalnızca 'donor' rolündeki kullanıcılar)."""
    data = request.get_json() or {}
    donor_id = data.get('donor_id')
    
    if not donor_id:
        return jsonify({"error": "Donör ID'si ('donor_id') zorunludur."}), 400
        
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "İlan bulunamadı."}), 404
        
    if listing.status != 'open':
        return jsonify({"error": "Bu ilan zaten üstlenilmiş veya kapatılmış."}), 400
        
    donor = User.query.get(donor_id)
    if not donor:
        return jsonify({"error": "Eşleşecek donör bulunamadı."}), 404
        
    if donor.role != 'donor':
        return jsonify({"error": "Sadece donör rolüne sahip kullanıcılar ilan üstlenebilir."}), 403
        
    try:
        listing.matched_donor_id = donor_id
        listing.status = 'matched'
        db.session.commit()
        
        return jsonify({
            "message": "İlan başarıyla donör ile eşleştirildi.",
            "listing": listing.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500
