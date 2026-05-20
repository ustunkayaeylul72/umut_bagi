from flask import Blueprint, jsonify, request, render_template
from app.models.user import User
from app import db
from app.utils.pdf_verifier import extract_and_verify_report

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# --- WEB ARAYÜZÜ (HTML) ROTALARI ---

@auth_bp.route('/view')
def auth_view():
    """Giriş Yap / Kayıt Ol arayüzünü (auth.html) döndürür."""
    return render_template('auth.html')

# --- API (JSON) UÇ NOKTALARI ---

@auth_bp.route('/register', methods=['POST'])
def register():
    """Kullanıcı kayıt API uç noktası."""
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    role = data.get('role')
    disability_summary = data.get('disability_summary')
    
    if not name or not email or not role:
        return jsonify({"error": "Eksik parametre. 'name', 'email' ve 'role' zorunludur."}), 400
        
    if role not in ['disabled', 'donor']:
        return jsonify({"error": "Geçersiz rol. Rol 'disabled' veya 'donor' olmalıdır."}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Bu e-posta adresi zaten kullanımda."}), 400
        
    try:
        new_user = User(
            name=name,
            email=email,
            role=role,
            disability_summary=disability_summary if role == 'disabled' else None,
            is_verified=False
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Kullanıcı başarıyla kaydedildi.",
            "user": new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Bir hata oluştu: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Kullanıcı giriş API uç noktası."""
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "E-posta adresi zorunludur."}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404
        
    return jsonify({
        "message": "Giriş başarılı.",
        "user": user.to_dict()
    }), 200

@auth_bp.route('/verify-report', methods=['POST'])
def verify_report():
    """
    Kullanıcının yüklediği engelli raporu PDF dosyasını RAM üzerinde geçici analiz ederek doğrular.
    Doğrulanan Engel Yüzdesi ve Engel Durumunu veritabanına yazar.
    T.C. Kimlik Numarası veritabanına asla kaydedilmez, sadece anlık e-Rapor sorgusu için kullanılır.
    """
    if 'report' not in request.files:
        return jsonify({"error": "Lütfen bir rapor dosyası (PDF) yükleyin."}), 400
        
    file = request.files['report']
    user_id = request.form.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Kullanıcı oturum bilgisi bulunamadı."}), 400
        
    if file.filename == '':
        return jsonify({"error": "Dosya seçilmedi."}), 400
        
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Yalnızca PDF formatındaki dosyalar desteklenmektedir."}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404
        
    # PDF dosya akışını oku, doğrula ve bilgileri çıkar
    success, message, percentage, group = extract_and_verify_report(file.stream)
    
    if success:
        try:
            # Kullanıcı durumunu doğrulanmış olarak güncelle ve engellilik detaylarını kaydet
            user.is_verified = True
            user.disability_percentage = percentage
            user.disability_group = group
            # Açıklamayı detaylı kılalım
            user.disability_summary = f"%{percentage} {group}"
            
            db.session.commit()
            return jsonify({
                "message": "Tebrikler! Hesabınız e-Devlet raporuyla başarıyla doğrulandı.",
                "user": user.to_dict()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Veritabanı güncellenirken hata oluştu: {str(e)}"}), 500
    else:
        return jsonify({"error": message}), 400
