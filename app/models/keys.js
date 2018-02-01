var mongoose = require('mongoose');

var keySchema = mongoose.Schema({
    keys: [{
        kty: String,
        use: String,
        kid: String,
        x5t: String,
        x5c: String,
        n: String,
        e: String
    }],
    
});

module.exports = mongoose.model('Key', keySchema);
