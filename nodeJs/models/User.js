const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

userSchema.pre('save', function(next) {
    // 비밀번호를 암호화 시킨다.
    const user = this;

    // 비밀번호를 변경하는게 아니라면 return
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(saltRounds, function(err, salt) {
        if(err) return next(err); // 에러 발생시 에러 리턴

        bcrypt.hash(user.password, salt, function(err, hash) {
            // hash => 바뀐 비빌번호
            if(err) return next(err);
            user.password = hash;
        });
    });

    next();
});

userSchema.methods.comparePassword = function(pass, cb) {
    // password 1234567     암호화된 비밀번호 $2~~  (복호화 불가 비밀번호를 암호화해서 비교)
    bcrypt.compare(pass, this.password, function(err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch);
    });
};

userSchema.methods.generateToken = function(cb) {
    // jsonwebtoken을 이용해서 token을 생성하기
    const user = this;
    const token = jwt.sign(user._id.toHexString(), 'secretToken');
    user.token = token;
    user.save(function(err, user) {
        if(err) return cb(err);
        cb(null, user);
    });

}; 

userSchema.statics.findByToken = function(token, cb) {
    const user = this;

    // 토큰을 decode 한다.
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저 아이디를 이용해서 유저를 찾은 다음에
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err, user) {
            if(err) return cb(err);
            cb(nuil, user);
        })
    });
};


const User = mongoose.model('User', userSchema);

module.exports = { User };





